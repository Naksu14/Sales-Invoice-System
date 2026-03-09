import React from 'react'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import PaidIcon from '@mui/icons-material/Paid'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { BarChart } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts/PieChart'
import MainBackground from '../../components/mainBackground'
import Sidebar from '../../components/sidebar'
import Navbar from '../../components/navbar'

const monthlyData = [120, 68, 103, 106, 45]
const venturesData = [45, 83, 78, 50, 112]
const monthLabels = ['January', 'February', 'March', 'April', 'May']

const pieData = [
  { id: 0, value: 38, label: 'Virtual Office', color: '#4b4f5c' },
  { id: 1, value: 27, label: 'Meeting Rooms', color: '#ccd83e' },
  { id: 2, value: 20, label: 'Walk-in', color: '#dce3b1' },
  { id: 3, value: 15, label: 'Others', color: '#a9c0a2' },
]

const recentInvoices = Array.from({ length: 6 }, (_, index) => ({
  id: index + 1,
  invoiceNo: '1004',
  dateIssued: '02/20/2026',
  clientName: 'Timedly Solutions, Inc.',
  serviceType: 'Virtual Office',
  amount: '3,500.00',
}))

export const DashboardPage = () => {
  return (
    <MainBackground>
      <Sidebar/>
      <Navbar/>
      <main className="min-h-screen w-full pl-80 pt-24 pr-4 pb-4">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-700">DASHBOARD</h1>
              <p className="mt-1 text-lg text-slate-500">Financial overview and analytics</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100/80 hover:border-slate-400 hover:text-slate-900"
              >
                <FileUploadIcon fontSize="small" />
                Export
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md bg-[#222625] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#e7e98a] hover:border-[#e7e98a] hover:text-[#222625]"
              >
                <NoteAddIcon fontSize="small" />
                Create Invoice
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-md bg-[#4e525f] p-4 text-[#e8ec97] shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-semibold leading-tight">Total Sales</p>
                    <div className="rounded-md bg-white/15 p-2 text-xl text-white">
                      ₱
                    </div>
                  </div>
                  <p className="mt-4 text-5xl font-bold text-[#e7e98a]">25,000</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-200">
                    <TrendingUpIcon sx={{ fontSize: 14 }} />
                    12% More than yesterday
                  </p>
                </div>

                <div className="rounded-md bg-[#d5e25a] p-4 text-[#202320] shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-semibold leading-tight">Receipts This Month</p>
                    <div className="rounded-md bg-black/10 p-2 text-[#222625]">
                      <ReceiptLongIcon fontSize="small" />
                    </div>
                  </div>
                  <p className="mt-4 text-5xl font-bold">58</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-700">
                    <TrendingUpIcon sx={{ fontSize: 14 }} />
                    12% More than yesterday
                  </p>
                </div>

                <div className="rounded-md bg-[#14161a] p-4 text-[#d7e47a] shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-semibold leading-tight">Total Receipts Acknowledged</p>
                    <div className="rounded-md bg-white/15 p-2 text-[#d7e47a]">
                      <TaskAltIcon fontSize="small" />
                    </div>
                  </div>
                  <p className="mt-4 text-5xl font-bold">22</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-300">
                    <TrendingUpIcon sx={{ fontSize: 14 }} />
                    12% More than yesterday
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold">REVENUE OVERVIEW</h2>
                  <select className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600">
                    <option>Month</option>
                    <option>Quarter</option>
                  </select>
                </div>

                <BarChart
                  height={260}
                  series={[
                    { data: monthlyData, label: 'Shirefolk Incorporation', color: '#cedf50', borderRadius: 8 },
                    { data: venturesData, label: 'Shirefolk Ventures', color: '#252a2f', borderRadius: 8 },
                  ]}
                  xAxis={[{ data: monthLabels, scaleType: 'band' }]}
                  margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
                  grid={{ horizontal: true }}
                />
              </div>

              <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">RECENT SERVICE INVOICES</h2>
                  <div className="flex items-center gap-2">
                    <select className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600">
                      <option>Shirefolk Ventures</option>
                      <option>Shirefolk Incorporation</option>
                    </select>
                    <div className="flex items-center rounded-md border border-slate-300 bg-white px-2 py-1.5">
                      <input
                        type="text"
                        placeholder="Search"
                        className="w-32 border-0 bg-transparent text-sm outline-none"
                      />
                      <SearchIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-y-0">
                    <thead>
                      <tr className="bg-slate-100 text-left text-sm text-slate-600">
                        <th className="rounded-l-md px-4 py-2 font-semibold">Invoice No.</th>
                        <th className="px-4 py-2 font-semibold">Date Issued</th>
                        <th className="px-4 py-2 font-semibold">Client Name</th>
                        <th className="px-4 py-2 font-semibold">Service Type</th>
                        <th className="px-4 py-2 font-semibold">Amount</th>
                        <th className="rounded-r-md px-4 py-2 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.map((invoice) => (
                        <tr key={invoice.id} className="text-sm text-slate-600">
                          <td className="border-b border-slate-200 px-4 py-4">{invoice.invoiceNo}</td>
                          <td className="border-b border-slate-200 px-4 py-4">{invoice.dateIssued}</td>
                          <td className="border-b border-slate-200 px-4 py-4">{invoice.clientName}</td>
                          <td className="border-b border-slate-200 px-4 py-4">{invoice.serviceType}</td>
                          <td className="border-b border-slate-200 px-4 py-4">{invoice.amount}</td>
                          <td className="border-b border-slate-200 px-4 py-4">
                            <button
                              type="button"
                              className="rounded-md bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"
                            >
                              <VisibilityIcon sx={{ fontSize: 18 }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-md border min-h-[300px] border-slate-300 bg-white p-6 shadow-sm">
              <h2 className="text-center text-sm font-bold text-slate-600">REVENUE BY SERVICE TYPE</h2>
              <div className="mt-2 flex justify-center">
                <PieChart
                  height={390}
                  series={[
                    {
                      data: pieData,
                      innerRadius: 40,
                      outerRadius: 70,
                      paddingAngle: 2,
                      cornerRadius: 4,
                    },
                  ]}
                  slotProps={{ legend: { hidden: true } }}
                />
              </div>

              <div className="rounded-md border border-slate-300 px-2 py-1 text-center text-xs text-slate-600">
                Shirefolk Ventures
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                {pieData.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </MainBackground>
  )
}
