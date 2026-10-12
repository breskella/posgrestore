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
      <div className="modal-box w-11/12 max-w-3xl max-h-[90vh] overflow-y-auto relative">
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={closeModal}
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
        >
          ✕
        </button>

        {/* MODAL HEADER */}
        <div className="flex justify-between items-center mb-6 pr-8">
          <div className="flex items-center gap-2">
            <HistoryIcon className="size-6 text-primary" />
            <h3 className="font-bold text-xl">System Activity Logs</h3>
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
          <div className="flex justify-center items-center py-12">
            <div className="loading loading-spinner loading-md" />
          </div>
        ) : logsError ? (
          <div className="alert alert-error my-6">{logsError}</div>
        ) : logs.length === 0 ? (
          <p className="text-center py-8 text-base-content/60">No activity logs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Product Name</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{getActionBadge(log.action)}</td>
                    <td className="font-semibold">{log.product_name}</td>
                    <td className="text-sm text-base-content/70">{log.details}</td>
                    <td className="text-xs text-base-content/50">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL ACTIONS */}
        <div className="modal-action">
          <form method="dialog">
            <button className="btn">Close</button>
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