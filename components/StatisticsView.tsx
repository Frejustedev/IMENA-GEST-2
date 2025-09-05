import React, { useMemo } from 'react';
import { 
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
    CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Patient, Room, RoomId, PeriodOption, ScintigraphyExam, PatientHistoryEntry } from '../types';
import { isDateInPeriod } from '../utils/dateUtils';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { ClockIcon } from './icons/ClockIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ClipboardDocumentCheckIcon } from './icons/ClipboardDocumentCheckIcon';

interface StatisticsViewProps {
  allPatients: Patient[];
  selectedPeriod: PeriodOption;
  roomsConfig: Room[];
}

const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 0) return 'N/A';
  const minutes = Math.floor(milliseconds / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const d = days;
  const h = hours % 24;
  const m = minutes % 60;
  let parts: string[] = [];
  if (d > 0) parts.push(`${d}j`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}min`);
  return parts.length > 0 ? parts.join(' ') : '< 1min';
};

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-5 rounded-xl shadow-lg flex items-center space-x-4">
        <div className="p-3 rounded-full bg-sky-100">{icon}</div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

export const StatisticsView: React.FC<StatisticsViewProps> = ({ 
    allPatients, 
    selectedPeriod, 
    roomsConfig,
}) => {
  
  const periodLabel = selectedPeriod === 'today' ? "Aujourd'hui" 
                    : selectedPeriod === 'thisWeek' ? "Cette Semaine" 
                    : "Ce Mois-ci";
    
  const { kpiData, patientFlowData, examDistributionData, averageWaitTimeData } = useMemo(() => {
    // KPI Calculations
    const patientIdsInPeriod = new Set<string>();
    allPatients.forEach(p => {
        if (p.history.some(h => isDateInPeriod(h.entryDate, selectedPeriod))) {
            patientIdsInPeriod.add(p.id);
        }
    });

    const examTypeStats: { [key in ScintigraphyExam]?: number } = {};
    const roomEntryCounts: { [key: string]: number } = {};
    const completedJourneys: { duration: number }[] = [];
    
    allPatients.forEach(patient => {
        let isCompletedInPeriod = false;
        const lastHistory = patient.history[patient.history.length-1];
        if ((lastHistory.roomId === RoomId.ARCHIVE || lastHistory.roomId === RoomId.RETRAIT_CR_SORTIE) && lastHistory.exitDate && isDateInPeriod(lastHistory.exitDate, selectedPeriod)) {
            isCompletedInPeriod = true;
        }

        if (isCompletedInPeriod && lastHistory.exitDate) {
            const duration = new Date(lastHistory.exitDate).getTime() - new Date(patient.creationDate).getTime();
            completedJourneys.push({ duration });
        }
      
        const requestData = patient.roomSpecificData?.[RoomId.REQUEST];
        if (requestData?.requestedExam && patient.history.some(h => h.roomId === RoomId.REQUEST && h.exitDate && isDateInPeriod(h.exitDate, selectedPeriod))) {
            examTypeStats[requestData.requestedExam] = (examTypeStats[requestData.requestedExam] || 0) + 1;
        }

        patient.history.forEach(h => {
          if (isDateInPeriod(h.entryDate, selectedPeriod)) {
            roomEntryCounts[h.roomId] = (roomEntryCounts[h.roomId] || 0) + 1;
          }
        });
    });
    
    const totalExams = Object.values(examTypeStats).reduce((sum, count) => sum + (count ?? 0), 0);
    const avgJourneyTime = completedJourneys.length > 0 ? completedJourneys.reduce((sum, j) => sum + j.duration, 0) / completedJourneys.length : 0;
    const busiestRoomId = Object.keys(roomEntryCounts).reduce((a, b) => roomEntryCounts[a] > roomEntryCounts[b] ? a : b, '');
    const busiestRoomName = roomsConfig.find(r => r.id === busiestRoomId)?.name || 'N/A';

    // Patient Flow Chart Data
    let flowData: { name: string; patients: number }[] = [];
    if (selectedPeriod === 'today') {
        const hourlyCounts = Array(13).fill(0).map((_, i) => ({ hour: i + 7, count: 0 })); // 7 AM to 7 PM
        allPatients.forEach(p => {
            if (isDateInPeriod(p.creationDate, 'today')) {
                const hour = new Date(p.creationDate).getHours();
                if (hour >= 7 && hour <= 19) {
                    hourlyCounts.find(h => h.hour === hour)!.count++;
                }
            }
        });
        flowData = hourlyCounts.map(h => ({ name: `${h.hour}:00`, patients: h.count }));
    } else if (selectedPeriod === 'thisWeek') {
        const weeklyCounts = [{d:'Lun',c:0},{d:'Mar',c:0},{d:'Mer',c:0},{d:'Jeu',c:0},{d:'Ven',c:0},{d:'Sam',c:0},{d:'Dim',c:0}];
        allPatients.forEach(p => {
            if (isDateInPeriod(p.creationDate, 'thisWeek')) {
                let dayIndex = new Date(p.creationDate).getDay() - 1;
                if (dayIndex < 0) dayIndex = 6; // Sunday
                weeklyCounts[dayIndex].c++;
            }
        });
        flowData = weeklyCounts.map(d => ({ name: d.d, patients: d.c }));
    } else { // thisMonth
        const monthDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const monthlyCounts = Array.from({length: monthDays}, (_, i) => ({ day: i + 1, count: 0 }));
        allPatients.forEach(p => {
            if (isDateInPeriod(p.creationDate, 'thisMonth')) {
                const dayOfMonth = new Date(p.creationDate).getDate();
                monthlyCounts[dayOfMonth - 1].count++;
            }
        });
        flowData = monthlyCounts.map(d => ({ name: String(d.day), patients: d.count }));
    }

    // Exam Distribution Data
    const sortedExamStats = Object.entries(examTypeStats)
      .map(([name, value]) => ({ name, value: value || 0}))
      .sort((a, b) => b.value - a.value);

    // Average Wait Time Data
    const waitTimes: { [key: string]: number[] } = {};
    const analysisRooms = roomsConfig.filter(r => r.id !== RoomId.GENERATOR && r.id !== RoomId.ARCHIVE);
    analysisRooms.forEach(r => waitTimes[r.id] = []);

    allPatients.forEach(p => {
        p.history.forEach(h => {
            if (h.exitDate && waitTimes[h.roomId] && isDateInPeriod(h.exitDate, selectedPeriod)) {
                const duration = new Date(h.exitDate).getTime() - new Date(h.entryDate).getTime();
                if (duration > 0) {
                    waitTimes[h.roomId].push(duration);
                }
            }
        });
    });

    const avgWaitTimeData = analysisRooms.map(r => {
        const waits = waitTimes[r.id];
        const averageMs = waits.length > 0 ? waits.reduce((a, b) => a + b, 0) / waits.length : 0;
        return {
            name: r.name,
            "Temps d'attente (min)": Math.round(averageMs / 60000),
        };
    });

    return {
        kpiData: {
            totalPatients: patientIdsInPeriod.size,
            totalExams,
            avgJourneyTime: formatDuration(avgJourneyTime),
            busiestRoom: busiestRoomName
        },
        patientFlowData: flowData,
        examDistributionData: sortedExamStats,
        averageWaitTimeData: avgWaitTimeData
    };
  }, [allPatients, selectedPeriod, roomsConfig]);

  const COLORS = ['#0ea5e9', '#14b8a6', '#8b5cf6', '#f97316', '#ec4899', '#facc15'];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <ChartBarIcon className="h-8 w-8 text-sky-600" />
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Tableau de Bord Analytique</h2>
            <p className="text-sm text-slate-500">Analyse de l'activité pour la période : <span className="font-semibold">{periodLabel}</span></p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Patients Actifs" value={kpiData.totalPatients} icon={<UsersIcon className="h-8 w-8 text-sky-500" />} />
        <KpiCard title="Examens Réalisés" value={kpiData.totalExams} icon={<ClipboardDocumentCheckIcon className="h-8 w-8 text-sky-500" />} />
        <KpiCard title="Durée Parcours Moy." value={kpiData.avgJourneyTime} icon={<ClockIcon className="h-8 w-8 text-sky-500" />} />
        <KpiCard title="Salle la + Fréquentée" value={kpiData.busiestRoom} icon={<ChartBarIcon className="h-8 w-8 text-sky-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Flux de Nouveaux Patients</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={patientFlowData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}/>
              <Legend wrapperStyle={{fontSize: "12px"}}/>
              <Line type="monotone" dataKey="patients" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Nouveaux Patients" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Répartition des Examens</h3>
           <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={examDistributionData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name.substring(0,15)}...: ${(percent * 100).toFixed(0)}%`} fontSize={10}>
                {examDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} examens`}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Temps d'Attente Moyen par Salle</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={averageWaitTimeData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" stroke="#64748b" fontSize={12} unit=" min"/>
            <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={120} />
            <Tooltip formatter={(value) => [`${value} min`, "Temps moyen"]} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}/>
            <Bar dataKey="Temps d'attente (min)" fill="#14b8a6" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
