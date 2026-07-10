export default function StatusModal({ selectedStep, confirmChange, onClose }) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-foreground">Change Order Status</h3>
        <p className="text-gray-600 dark:text-muted-foreground mb-6">
          The order will be moved to <b className="text-gray-900 dark:text-foreground">{selectedStep?.title}</b>.
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded border border-gray-300 dark:border-border hover:bg-gray-100 dark:hover:bg-muted text-gray-700 dark:text-foreground"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={confirmChange}
          >
            Confirm
          </button>
        </div>
      </div>
    );
  }
  