interface SendActionsProps {
  onSaveLater: () => void;
  isSending: boolean;
  canSend: boolean;
  phoneCount: number;
}

const SendActions = ({ onSaveLater, isSending, canSend, phoneCount }: SendActionsProps) => {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onSaveLater}
        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition font-semibold"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        Guardar y enviar después
      </button>
      <button
        type="submit"
        disabled={!canSend || isSending}
        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {isSending ? 'Enviando...' : `Enviar Mensajes (${phoneCount})`}
      </button>
    </div>
  );
};

export default SendActions;
