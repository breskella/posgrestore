import { useProductStore } from "../store/useProductStore";
import { HistoryIcon, PlusCircleIcon, EditIcon, Trash2Icon, RefreshCwIcon } from "lucide-react";

function ActivityLogsModal() {
  // Extracting logs state and actions from the global product store
  const { logs, fetchLogs, loadingLogs, logsError } = useProductStore();

  // Helper function to close modal
  const closeModal = () => {
    const modal = document.getElementById("activity_logs_modal");
    if (modal) modal.close();
  };

  // Helper function to get badge color and icon based on action type
  const getActionBadge = (action) => {
    switch (action) {
      case "ADD":
        return <span className="badge badge-success gap-1 text-white"><PlusCircleIcon className="size-3.5" /> ADD</span>;
      case "UPDATE":
        return <span className="badge badge-info gap-1 text-white"><EditIcon className="size-3.5" /> UPDATE</span>;
      case "DELETE":
        return <span className="badge badge-error gap-1 text-white"><Trash2Icon className="size-3.5" /> DELETE</span>;
      default:
        return <span className="badge badge-ghost">{action}</span>;
    }
  };

  return (
    <dialog id="activity_logs_modal" className="modal">
      <div className="modal-box w-11/12 max-w-4xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto relative">
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={closeModal}
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* MODAL HEADER */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 pr-6 sm:pr-8">
          <div className="flex items-center gap-2">
            <HistoryIcon className="size-5 sm:size-6 text-primary shrink-0" />
            <h3 className="font-bold text-lg sm:text-xl">System Activity Logs</h3>
          </div>
          <button 
            type="button"
            className="btn btn-ghost btn-sm btn-circle" 
            onClick={fetchLogs} 
            title="Refresh Logs"
          >
            <RefreshCwIcon className={`size-4 ${loadingLogs ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* LOGS CONTENT AREA */}
        {loadingLogs ? (
          <div className="overflow-x-auto rounded-xl border border-base-200/60" aria-label="Loading activity logs" aria-busy="true">
            <table className="table table-sm sm:table-md w-full min-w-[500px]">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Product Name</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }, (_, index) => (
                  <tr key={index} aria-hidden="true">
                    <td><div className="skeleton h-5 w-16" /></td>
                    <td><div className="skeleton h-4 w-28" /></td>
                    <td><div className="skeleton h-4 w-36" /></td>
                    <td><div className="skeleton h-4 w-24" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center">
            {logsError ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={fetchLogs}>
                Try again
              </button>
            ) : (
              <p className="text-base-content/60">No activity logs recorded yet.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh] rounded-xl border border-base-200/60">
            <table className="table table-zebra table-sm sm:table-md w-full min-w-[500px]">
              <thead>
                <tr>
                  <th className="text-xs font-semibold">Action</th>
                  <th className="text-xs font-semibold">Product Name</th>
                  <th className="text-xs font-semibold">Details</th>
                  <th className="text-xs font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="text-xs sm:text-sm">
                    <td>{getActionBadge(log.action)}</td>
                    <td className="font-semibold text-base-content">{log.product_name}</td>
                    <td className="text-base-content/70">{log.details}</td>
                    <td className="text-xs text-base-content/50 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL ACTIONS */}
        <div className="modal-action mt-6">
          <form method="dialog">
            <button className="btn btn-sm sm:btn-md">Close</button>
          </form>
        </div>
      </div>

      {/* BACKDROP */}
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

export default ActivityLogsModal;