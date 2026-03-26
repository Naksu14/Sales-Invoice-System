import { Circle, Document, Image, Line, Page, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer'
import reportLogo from '../../assets/logopdf.png'

const pdfStyles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    color: '#0f172a',
  },
  headerLogoWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLogo: {
    width: 50,
    height: 50,
    objectFit: 'contain',
  },
  title: {
    fontSize: 16,
    marginBottom: 6,
    fontWeight: 700,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 4,
    color: '#475569',
  },
  submeta: {
    marginBottom: 10,
    color: '#64748b',
  },
  section: {
    marginBottom: 12,
    border: '1 solid #d1d5db',
    borderRadius: 4,
    padding: 6,
  },
  sectionTitle: {
    fontSize: 11,
    marginBottom: 6,
    fontWeight: 700,
    backgroundColor: '#e5e7eb',
    color: '#374151',
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 2,
    borderBottom: '1 solid #f1f5f9',
  },
  label: {
    color: '#334155',
  },
  value: {
    color: '#0f172a',
  },
  note: {
    marginTop: 10,
    textAlign: 'center',
    color: '#64748b',
  },
  chartTitle: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 700,
    color: '#4b5563',
    marginBottom: 6,
  },
  chartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  legendWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    marginRight: 4,
  },
  legendLabel: {
    fontSize: 9,
    color: '#475569',
  },
  insightText: {
    color: '#4b5563',
  },
})

const polarToCartesian = (cx, cy, r, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: cx + (r * Math.cos(angleInRadians)),
    y: cy + (r * Math.sin(angleInRadians)),
  }
}

const makePieSlicePath = (cx, cy, radius, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`
}

const PieChartSection = ({ serviceRows }) => {
  const chartRows = (serviceRows || []).filter((row) => Number(row.count || 0) > 0)
  const total = chartRows.reduce((sum, row) => sum + Number(row.count || 0), 0)

  if (!chartRows.length || total <= 0) {
    return <Text style={pdfStyles.value}>No service data available for the selected date range.</Text>
  }

  const cx = 120
  const cy = 100
  const radius = 62
  let runningAngle = 0

  return (
    <View>
      <Text style={pdfStyles.chartTitle}>Type of Service (Revenue)</Text>
      <View style={pdfStyles.chartWrap}>
        <Svg width={240} height={210}>
          {chartRows.map((row) => {
            const value = Number(row.count || 0)
            const angle = (value / total) * 360
            const startAngle = runningAngle
            const endAngle = runningAngle + angle
            runningAngle = endAngle
            return (
              <Path
                key={row.serviceType}
                d={makePieSlicePath(cx, cy, radius, startAngle, endAngle)}
                fill={row.color || '#94a3b8'}
                stroke="#ffffff"
                strokeWidth={1}
              />
            )
          })}
          <Circle cx={cx} cy={cy} r={1} fill="#ffffff" />
          <Line x1={20} y1={178} x2={220} y2={178} stroke="#e5e7eb" strokeWidth={1} />
        </Svg>
      </View>

      <View style={pdfStyles.legendWrap}>
        {chartRows.map((row) => (
          <View key={`legend-${row.serviceType}`} style={pdfStyles.legendItem}>
            <View style={{ ...pdfStyles.legendDot, backgroundColor: row.color || '#94a3b8' }} />
            <Text style={pdfStyles.legendLabel}>{row.serviceType}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const DashboardAnalyticsPdfDocument = ({
  generatedAt,
  exportedByName,
  startDate,
  endDate,
  summaryRows,
  monthlyRows,
  serviceRows,
  recentRows,
}) => {
  const reportYear = monthlyRows?.[0]?.monthKey ? String(monthlyRows[0].monthKey).slice(0, 4) : new Date().getFullYear()
  const reportPeriod = `${startDate || 'N/A'} - ${endDate || 'N/A'}`
  const sortedServiceRows = [...(serviceRows || [])].sort((a, b) => Number(b?.count || 0) - Number(a?.count || 0))
  const highestCount = sortedServiceRows.length ? Number(sortedServiceRows[0]?.count || 0) : null
  const lowestCount = sortedServiceRows.length ? Number(sortedServiceRows[sortedServiceRows.length - 1]?.count || 0) : null
  const topServices = highestCount === null
    ? []
    : sortedServiceRows.filter((row) => Number(row?.count || 0) === highestCount)
  const underperformingServices = lowestCount === null
    ? []
    : sortedServiceRows.filter((row) => Number(row?.count || 0) === lowestCount)

  const formatServiceList = (items, countValue) => {
    if (!items.length) return 'N/A'
    const names = items.map((row) => row.serviceType).join(', ')
    return `${names} (Total Count: ${countValue})`
  }

  return (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.headerLogoWrap}>
        <Image src={reportLogo} style={pdfStyles.headerLogo} />
      </View>
      <Text style={pdfStyles.title}>SALES INVOICE REPORT</Text>
      <Text style={pdfStyles.subtitle}>Generated on : {generatedAt}</Text>
      <Text style={pdfStyles.subtitle}>Report Period : {reportPeriod}</Text>
      <Text style={pdfStyles.submeta}>Generated by : {exportedByName || 'Staff Name'}</Text>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Summary Overview</Text>
        {summaryRows.map((row) => (
          <View style={pdfStyles.row} key={row.metric}>
            <Text style={pdfStyles.label}>{row.metric}</Text>
            <Text style={pdfStyles.value}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Monthly Revenue ({reportYear})</Text>
        {monthlyRows.slice(0, 12).map((row) => (
          <View style={pdfStyles.row} key={row.month}>
            <Text style={pdfStyles.label}>{row.month}</Text>
            <Text style={pdfStyles.value}>{row.totalRevenue}</Text>
          </View>
        ))}
      </View>

      <View style={pdfStyles.section}>
        <PieChartSection serviceRows={serviceRows} />
      </View>

      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Service Performance Insights</Text>
        <Text style={pdfStyles.insightText}>
          Top Performing Service: {formatServiceList(topServices, highestCount)}
        </Text>
        <Text style={pdfStyles.insightText}>
          Underperforming Service: {formatServiceList(underperformingServices, lowestCount)}
        </Text>
      </View>

      <Text style={pdfStyles.note}>This report summarizes the current dashboard filter selection.</Text>
    </Page>
  </Document>
  )
}

export default DashboardAnalyticsPdfDocument
