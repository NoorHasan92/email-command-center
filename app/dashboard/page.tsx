export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards for dashboard */}
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Emails</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">0</div>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Action Items</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">0</div>
          </div>
        </div>
      </div>
      
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Emails processed today.</p>
        </div>
        <div className="p-6 pt-0">
          <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
}
