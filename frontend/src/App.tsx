import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowUpRight, Bell, BriefcaseBusiness, CalendarDays, ChevronDown, ClipboardList,
  LayoutDashboard, Menu, Pencil, Plus, Search, Settings, Trash2, Users, X,
} from 'lucide-react'
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { createEmployee, deleteEmployee, getEmployee, getEmployeeLeaves, getEmployees, updateEmployee } from './api/employees'
import { createLeave, deleteLeave, getLeave, getLeaves, updateLeave, updateLeaveStatus } from './api/leaves'
import type { Employee, EmployeePayload, Leave, LeavePayload, LeaveStatus } from './types/api'
import './App.css'

const navigation = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Employees', path: '/employees', icon: Users },
  { label: 'Leave requests', path: '/leaves', icon: ClipboardList },
]

function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  return (
    <div className="app-shell">
      <Sidebar mobileNavOpen={mobileNavOpen} close={() => setMobileNavOpen(false)} />
      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button>
          <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>Employee management</strong></div>
          <div className="topbar-actions">
            <label className="search-box"><Search size={17} /><input placeholder="Search anything..." /><kbd>⌘ K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><span /></button>
            <div className="profile"><div className="avatar">AV</div><div className="profile-copy"><strong>Admin User</strong><small>Administrator</small></div><ChevronDown size={16} /></div>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
          <Route path="/leaves" element={<LeavesPage />} />
          <Route path="/leaves/:id" element={<LeaveDetailsPage />} />
          <Route path="/settings" element={<EmptyPage title="Settings" />} />
        </Routes>
      </main>
    </div>
  )
}

function Sidebar({ mobileNavOpen, close }: { mobileNavOpen: boolean; close: () => void }) {
  const leaves = useQuery({ queryKey: ['leaves'], queryFn: () => getLeaves() })
  const pending = leaves.data?.filter((leave) => leave.status === 'pending').length ?? 0
  return (
    <aside className={`sidebar ${mobileNavOpen ? 'sidebar--open' : ''}`}>
      <div className="brand"><div className="brand-mark">EM</div><div><strong>People<span>ly</span></strong><small>Employee workspace</small></div><button className="icon-button sidebar-close" aria-label="Close navigation" onClick={close}><X size={18} /></button></div>
      <div className="workspace-switcher"><div className="avatar avatar--small">AV</div><div><strong>Acme workspace</strong><small>Team administration</small></div><ChevronDown size={16} /></div>
      <nav className="primary-nav" aria-label="Primary navigation">
        <span className="nav-label">Workspace</span>
        {navigation.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`} onClick={close}>
            <Icon size={18} /><span>{label}</span>{label === 'Leave requests' && pending > 0 && <b className="nav-count">{pending}</b>}
          </NavLink>
        ))}
        <span className="nav-label nav-label--spaced">Manage</span>
        <NavLink to="/settings" className="nav-item" onClick={close}><Settings size={18} /><span>Settings</span></NavLink>
      </nav>
      <div className="sidebar-tip"><div className="tip-icon"><ArrowUpRight size={17} /></div><strong>Grow together</strong><p>One clear view of your people, progress, and time.</p></div>
      <div className="sidebar-footer"><span className="status-dot" />All systems operational</div>
    </aside>
  )
}

function Dashboard() {
  const employees = useQuery({ queryKey: ['employees'], queryFn: () => getEmployees() })
  const leaves = useQuery({ queryKey: ['leaves'], queryFn: () => getLeaves() })
  const people = employees.data ?? []
  const timeOff = leaves.data ?? []
  const pending = timeOff.filter((leave) => leave.status === 'pending')
  const approved = timeOff.filter((leave) => leave.status === 'approved')
  const departments = Object.entries(people.reduce<Record<string, number>>((summary, employee) => {
    summary[employee.department] = (summary[employee.department] ?? 0) + 1
    return summary
  }, {})).sort(([, a], [, b]) => b - a)
  const hasError = employees.isError || leaves.isError
  const stats = [
    ['Total employees', people.length, 'People in your workspace', Users, 'green'],
    ['Pending requests', pending.length, 'Needs your attention', ClipboardList, 'orange'],
    ['Approved leave', approved.length, 'Requests this period', CalendarDays, 'purple'],
    ['Departments', departments.length, 'Active team groups', BriefcaseBusiness, 'blue'],
  ] as const
  return (
    <div className="dashboard">
      <section className="page-heading"><div><p className="eyebrow">Workspace overview</p><h1>Good morning, Admin<span>.</span></h1><p className="heading-copy">Here&apos;s what&apos;s happening with your team today.</p></div><Link className="primary-button" to="/employees?new=true"><Plus size={17} /> Add employee</Link></section>
      {hasError && <ErrorNotice />}
      <section className="stat-grid">{stats.map(([label, value, note, Icon, tone]) => <article className="stat-card" key={label}><div className={`stat-icon stat-icon--${tone}`}><Icon size={20} /></div><div className="stat-card-copy"><span>{label}</span><strong>{employees.isLoading || leaves.isLoading ? '—' : value}</strong><small>{note}</small></div></article>)}</section>
      <section className="dashboard-grid">
        <article className="panel team-panel"><PanelHeading eyebrow="People overview" title="Team at a glance" action="View employees" href="/employees" /><div className="team-visual"><div className="donut"><div><strong>{people.length}</strong><span>people</span></div></div><div className="department-list">{departments.length ? departments.slice(0, 4).map(([name, count], index) => <div className="department-row" key={name}><span><i className={`legend-dot legend-dot--${index}`} />{name}</span><strong>{count}</strong></div>) : <p className="empty-copy">Add employees to see department distribution.</p>}</div></div></article>
        <article className="panel requests-panel"><PanelHeading eyebrow="Time off" title="Leave requests" action="View all" href="/leaves" /><div className="request-summary"><div><strong>{pending.length}</strong><span>Waiting for review</span></div><div><strong>{approved.length}</strong><span>Approved requests</span></div></div><div className="request-list">{pending.slice(0, 3).map((leave) => <LeaveRow key={leave.id} leave={leave} />)}{!pending.length && <EmptyState text="No pending requests" />}</div></article>
        <article className="panel activity-panel"><PanelHeading eyebrow="Workspace" title="Quick actions" /><div className="activity-list"><Link className="activity-row" to="/employees?new=true"><div className="activity-icon activity-icon--green"><Users size={17} /></div><div><strong>Add an employee</strong><span>Create a complete employee profile</span></div><ArrowUpRight size={15} /></Link><Link className="activity-row" to="/leaves?new=true"><div className="activity-icon activity-icon--purple"><CalendarDays size={17} /></div><div><strong>Request time off</strong><span>Record a leave request</span></div><ArrowUpRight size={15} /></Link><Link className="activity-row" to="/leaves"><div className="activity-icon activity-icon--orange"><ClipboardList size={17} /></div><div><strong>Review requests</strong><span>Approve or reject pending leave</span></div><ArrowUpRight size={15} /></Link></div></article>
      </section>
    </div>
  )
}

function EmployeesPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [editing, setEditing] = useState<Employee | null>(null)
  const [showForm, setShowForm] = useState(new URLSearchParams(location.search).get('new') === 'true')
  const employees = useQuery({ queryKey: ['employees', search, department], queryFn: () => getEmployees({ q: search || undefined, department: department || undefined }) })
  const allEmployees = useQuery({ queryKey: ['employees-all'], queryFn: () => getEmployees() })
  const remove = useMutation({ mutationFn: deleteEmployee, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }) })
  const departments = [...new Set((allEmployees.data ?? []).map((employee) => employee.department))].sort()
  function closeForm() { setShowForm(false); setEditing(null); if (location.search) navigate('/employees', { replace: true }) }
  return <PageFrame eyebrow="Workspace" title="Employees" description="Create, update, and manage every employee profile." action={<button className="primary-button" onClick={() => { setEditing(null); setShowForm(true) }}><Plus size={17} /> Add employee</button>}>
    <div className="toolbar"><label className="field search-field"><Search size={16} /><input placeholder="Search name or employee ID" value={search} onChange={(event) => setSearch(event.target.value)} /></label><select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">All departments</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></div>
    {employees.isError ? <ErrorNotice /> : <div className="table-card"><table><thead><tr><th>Employee</th><th>Department</th><th>Skills</th><th>Appointment</th><th>Actions</th></tr></thead><tbody>{employees.data?.map((employee) => <tr key={employee.id}><td><Link className="person-cell" to={`/employees/${employee.id}`}><span className="avatar avatar--table">{employee.name.slice(0, 2).toUpperCase()}</span><span><strong>{employee.name}</strong><small>{employee.employee_code}</small></span></Link></td><td>{employee.department}</td><td><div className="tag-list">{employee.skills.slice(0, 2).map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div></td><td>{formatDate(employee.date_of_appointment)}</td><td><div className="row-actions"><button title="Edit employee" onClick={() => { setEditing(employee); setShowForm(true) }}><Pencil size={15} /></button><button title="Delete employee" onClick={() => { if (confirm(`Delete ${employee.name}?`)) remove.mutate(employee.id) }}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table>{!employees.data?.length && <EmptyState text="No employees match your filters." />}</div>}
    {showForm && <EmployeeForm employee={editing} onClose={closeForm} onSaved={() => { closeForm(); queryClient.invalidateQueries({ queryKey: ['employees'] }) }} />}
  </PageFrame>
}

function EmployeeDetailsPage() {
  const { id } = useParams()
  const employeeId = Number(id)
  const employee = useQuery({ queryKey: ['employee', employeeId], queryFn: () => getEmployee(employeeId), enabled: Number.isInteger(employeeId) })
  const leaves = useQuery({ queryKey: ['employee-leaves', employeeId], queryFn: () => getEmployeeLeaves(employeeId), enabled: Number.isInteger(employeeId) })
  if (employee.isLoading) return <LoadingPage />
  if (employee.isError || !employee.data) return <PageFrame eyebrow="Employee" title="Employee not found" description="The requested employee could not be loaded." />
  return <PageFrame eyebrow={employee.data.employee_code} title={employee.data.name} description={`${employee.data.department} · Joined ${formatDate(employee.data.date_of_appointment)}`}><div className="detail-grid"><article className="panel detail-card"><h2>Profile</h2><Detail label="Employee ID" value={employee.data.employee_code} /><Detail label="Department" value={employee.data.department} /><Detail label="Date of appointment" value={formatDate(employee.data.date_of_appointment)} /><div><span className="detail-label">Skills</span><div className="tag-list">{employee.data.skills.map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div></div></article><article className="panel detail-card"><h2>Leave history</h2>{leaves.data?.map((leave) => <LeaveRow key={leave.id} leave={leave} />)}{!leaves.data?.length && <EmptyState text="No leave history for this employee." />}</article></div></PageFrame>
}

function LeaveDetailsPage() {
  const { id } = useParams()
  const leaveId = Number(id)
  const leave = useQuery({ queryKey: ['leave', leaveId], queryFn: () => getLeave(leaveId), enabled: Number.isInteger(leaveId) })
  const employees = useQuery({ queryKey: ['employees'], queryFn: () => getEmployees() })
  if (leave.isLoading) return <LoadingPage />
  if (leave.isError || !leave.data) return <PageFrame eyebrow="Leave request" title="Request not found" description="The requested leave could not be loaded." />
  const employee = employees.data?.find((item) => item.id === leave.data.employee_id)
  return <PageFrame eyebrow={`Request #${leave.data.id}`} title="Leave request" description={`${employee?.name ?? `Employee #${leave.data.employee_id}`} · Created ${formatDate(leave.data.created_at.slice(0, 10))}`}><article className="panel detail-card leave-detail"><div className="leave-detail-header"><StatusBadge status={leave.data.status} /><h2>{leave.data.purpose}</h2></div><Detail label="Employee" value={employee?.name ?? `Employee #${leave.data.employee_id}`} /><Detail label="Start date" value={formatDate(leave.data.start_date)} /><Detail label="End date" value={formatDate(leave.data.end_date)} /><Detail label="Status" value={leave.data.status} /></article></PageFrame>
}

function LeavesPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<LeaveStatus | ''>('')
  const [employeeId, setEmployeeId] = useState('')
  const [editing, setEditing] = useState<Leave | null>(null)
  const [showForm, setShowForm] = useState(new URLSearchParams(location.search).get('new') === 'true')
  const leaves = useQuery({ queryKey: ['leaves', status, employeeId], queryFn: () => getLeaves({ status: status || undefined, employee_id: employeeId ? Number(employeeId) : undefined }) })
  const employees = useQuery({ queryKey: ['employees'], queryFn: () => getEmployees() })
  const changeStatus = useMutation({ mutationFn: ({ id, nextStatus }: { id: number; nextStatus: LeaveStatus }) => updateLeaveStatus(id, nextStatus), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] }) })
  const remove = useMutation({ mutationFn: deleteLeave, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leaves'] }) })
  return <PageFrame eyebrow="Workspace" title="Leave requests" description="Review, approve, reject, and record employee time off." action={<button className="primary-button" onClick={() => setShowForm(true)}><Plus size={17} /> New request</button>}>
    <div className="toolbar"><select value={status} onChange={(event) => setStatus(event.target.value as LeaveStatus | '')}><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}><option value="">All employees</option>{employees.data?.map((employee) => <option value={employee.id} key={employee.id}>{employee.name}</option>)}</select></div>
    {leaves.isError ? <ErrorNotice /> : <div className="table-card"><table><thead><tr><th>Employee</th><th>Dates</th><th>Purpose</th><th>Status</th><th>Actions</th></tr></thead><tbody>{leaves.data?.map((leave) => <tr key={leave.id}><td><Link className="person-cell" to={`/employees/${leave.employee_id}`}><span className="avatar avatar--table">{leave.employee_id}</span><span><strong>{employees.data?.find((employee) => employee.id === leave.employee_id)?.name ?? `Employee #${leave.employee_id}`}</strong><small>Request #{leave.id}</small></span></Link></td><td><Link className="table-link" to={`/leaves/${leave.id}`}>{formatDate(leave.start_date)} – {formatDate(leave.end_date)}</Link></td><td className="purpose-cell">{leave.purpose}</td><td><StatusBadge status={leave.status} /></td><td><div className="row-actions">{leave.status === 'pending' && <><button title="Edit request" onClick={() => setEditing(leave)}><Pencil size={15} /></button><button title="Approve" className="approve-button" onClick={() => changeStatus.mutate({ id: leave.id, nextStatus: 'approved' })}>Approve</button><button title="Reject" className="reject-button" onClick={() => changeStatus.mutate({ id: leave.id, nextStatus: 'rejected' })}>Reject</button></>}<button title="Delete request" onClick={() => { if (confirm('Delete this leave request?')) remove.mutate(leave.id) }}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table>{!leaves.data?.length && <EmptyState text="No leave requests match your filters." />}</div>}
    {(showForm || editing) && <LeaveForm employees={employees.data ?? []} leave={editing} onClose={() => { setShowForm(false); setEditing(null) }} onSaved={() => { setShowForm(false); setEditing(null); queryClient.invalidateQueries({ queryKey: ['leaves'] }) }} />}
  </PageFrame>
}

function EmployeeForm({ employee, onClose, onSaved }: { employee: Employee | null; onClose: () => void; onSaved: () => void }) {
  const mutation = useMutation({ mutationFn: (payload: EmployeePayload) => employee ? updateEmployee(employee.id, payload) : createEmployee(payload), onSuccess: onSaved })
  const [form, setForm] = useState<EmployeePayload>({ employee_code: employee?.employee_code ?? '', name: employee?.name ?? '', department: employee?.department ?? '', skills: employee?.skills ?? [], date_of_appointment: employee?.date_of_appointment ?? '' })
  const [skills, setSkills] = useState((employee?.skills ?? []).join(', '))
  function submit(event: FormEvent) { event.preventDefault(); mutation.mutate({ ...form, skills: skills.split(',').map((skill) => skill.trim()).filter(Boolean) }) }
  return <Modal title={employee ? 'Edit employee' : 'Add employee'} onClose={onClose}><form className="modal-form" onSubmit={submit}><Field label="Employee ID"><input required value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} placeholder="EMP001" /></Field><Field label="Full name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" /></Field><Field label="Department"><input required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Engineering" /></Field><Field label="Skills"><input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Python, FastAPI" /><small>Separate skills with commas.</small></Field><Field label="Date of appointment"><input required type="date" value={form.date_of_appointment} onChange={(e) => setForm({ ...form, date_of_appointment: e.target.value })} /></Field>{mutation.isError && <MutationError error={mutation.error} />}<ModalActions onClose={onClose} loading={mutation.isPending} label={employee ? 'Save changes' : 'Create employee'} /></form></Modal>
}

function LeaveForm({ employees, leave, onClose, onSaved }: { employees: Employee[]; leave: Leave | null; onClose: () => void; onSaved: () => void }) {
  const mutation = useMutation({ mutationFn: (payload: LeavePayload) => leave ? updateLeave(leave.id, payload) : createLeave(payload), onSuccess: onSaved })
  const [form, setForm] = useState<LeavePayload>({ employee_id: leave?.employee_id ?? employees[0]?.id ?? 0, start_date: leave?.start_date ?? '', end_date: leave?.end_date ?? '', purpose: leave?.purpose ?? '' })
  function submit(event: FormEvent) { event.preventDefault(); mutation.mutate(form) }
  return <Modal title={leave ? 'Edit leave request' : 'New leave request'} onClose={onClose}><form className="modal-form" onSubmit={submit}><Field label="Employee"><select required disabled={Boolean(leave)} value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: Number(e.target.value) })}>{employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name} ({employee.employee_code})</option>)}</select></Field><div className="form-row"><Field label="Start date"><input required type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field><Field label="End date"><input required type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field></div><Field label="Purpose"><textarea required rows={4} maxLength={1000} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Reason for leave" /></Field>{mutation.isError && <MutationError error={mutation.error} />}<ModalActions onClose={onClose} loading={mutation.isPending} label={leave ? 'Save changes' : 'Create request'} /></form></Modal>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div>{children}</section></div> }
function ModalActions({ onClose, loading, label }: { onClose: () => void; loading: boolean; label: string }) { return <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={loading}>{loading ? 'Saving...' : label}</button></div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span>{label}</span>{children}</label> }
function PanelHeading({ eyebrow, title, action, href }: { eyebrow: string; title: string; action?: string; href?: string }) { return <div className="panel-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action && href ? <Link className="text-button" to={href}>{action}<ArrowUpRight size={15} /></Link> : null}</div> }
function PageFrame({ eyebrow, title, description, action, children }: { eyebrow: string; title: string; description: string; action?: React.ReactNode; children?: React.ReactNode }) { return <div className="dashboard"><section className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}<span>.</span></h1><p className="heading-copy">{description}</p></div>{action}</section>{children}</div> }
function LeaveRow({ leave }: { leave: Leave }) { return <div className="request-row"><div className="avatar avatar--request">{leave.employee_id}</div><div><strong>Employee #{leave.employee_id}</strong><small>{leave.purpose}</small></div><StatusBadge status={leave.status} /></div> }
function StatusBadge({ status }: { status: LeaveStatus }) { return <span className={`status-badge status-badge--${status}`}>{status}</span> }
function Detail({ label, value }: { label: string; value: string }) { return <div className="detail-item"><span className="detail-label">{label}</span><strong>{value}</strong></div> }
function EmptyState({ text }: { text: string }) { return <div className="empty-state"><div className="empty-state-icon"><ClipboardList size={20} /></div><strong>{text}</strong></div> }
function ErrorNotice() { return <div className="api-notice"><span className="status-dot status-dot--warning" />Unable to connect to the API. Start the FastAPI server and try again.</div> }
function MutationError({ error }: { error: Error }) { return <div className="form-error">{error.message || 'The request could not be completed.'}</div> }
function LoadingPage() { return <PageFrame eyebrow="Loading" title="Please wait" description="Loading employee details..." /> }
function EmptyPage({ title }: { title: string }) { return <PageFrame eyebrow="Workspace" title={title} description="This section is ready for configuration." /> }
function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) }

export default App
