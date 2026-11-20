import React from "react";

import TaskManagerCRM from "./TaskManagerCRM";

type TarefasCRMProps = {
    cardId: string | number;
};

export default function TarefasCRM({ cardId }: TarefasCRMProps) {
    return (
        <TaskManagerCRM
            cardId={cardId}
            title="Tarefas"
            addButtonLabel="Adicionar tarefa"
            visibleValue={0}
            emptyStateText="Nenhuma tarefa cadastrada."
            addDialogTitle="Adicionar tarefa"
            editDialogTitle="Editar tarefa"
        />
    );
}
