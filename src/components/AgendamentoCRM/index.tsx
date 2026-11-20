import React from "react";

import TaskManagerCRM from "../TarefasCRM/TaskManagerCRM";

type AgendamentoCRMProps = {
    cardId: string | number;
};

export default function AgendamentoCRM({ cardId }: AgendamentoCRMProps) {
    return (
        <TaskManagerCRM
            cardId={cardId}
            title="Sessão gratuita"
            addButtonLabel="Agendar sessão"
            visibleValue={2}
            fixedDescription="Sessão Gratuita"
            showDescriptionField={false}
            showDescriptionColumn={false}
            emptyStateText="Nenhuma sessão gratuita agendada."
            addDialogTitle="Agendar sessão gratuita"
            editDialogTitle="Editar sessão gratuita"
        />
    );
}