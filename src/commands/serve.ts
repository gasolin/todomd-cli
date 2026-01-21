import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Commander } from "./Commander.js";
import { ValidCommands } from "../types/Commands.js";
import { isNearDue } from "../lib/DueDate.js";

export const serve = async (
    todoDir: string,
    todoFile?: string,
    doneFile?: string
) => {
    const commander = new Commander(todoDir, todoFile, doneFile);

    const server = new Server(
        { name: "todomd-cli", version: "0.10.3" },
        { capabilities: { tools: {} } }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                {
                    name: "list_tasks",
                    description: "List all tasks from the todo list as structured JSON data, including their status, projects, and due dates.",
                    inputSchema: { type: "object", properties: {} },
                },
                {
                    name: "add_task",
                    description: "Add a new task to the todo list. You can include projects (+project), contexts (@context), and due dates (due:YYYY-MM-DD) in the description.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            description: {
                                type: "string",
                                description: "The task description to add.",
                            },
                        },
                        required: ["description"],
                    },
                },
                {
                    name: "complete_task",
                    description: "Mark a specific task as completed using its ID (id) from the task list.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            id: { type: "number", description: "The 1-based ID of the task to complete." },
                        },
                        required: ["id"],
                    },
                },
            ],
        };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;

        if (name === "list_tasks") {
            const result = await commander.run(ValidCommands.List, []);
            if (Array.isArray(result)) {
                const tasksWithNearDue = result.map((t) => ({
                    ...t,
                    isNearDue: t.dueDate ? isNearDue(t.dueDate) : false,
                }));
                return {
                    content: [
                        { type: "text", text: JSON.stringify(tasksWithNearDue, null, 2) },
                    ],
                };
            }
            return {
                content: [{ type: "text", text: String(result) }],
            };
        }

        if (name === "add_task") {
            const description = (args as any).description;
            const result = await commander.run(ValidCommands.Add, [description]);
            const isError = typeof result === "string" && result.startsWith("Error");
            return {
                content: [{ type: "text", text: String(result) }],
                isError,
            };
        }

        if (name === "complete_task") {
            const id = (args as any).id;
            const result = await commander.run(ValidCommands.Done, [String(id)]);
            const isError = typeof result === "string" && result.startsWith("Error");
            return {
                content: [{ type: "text", text: String(result) }],
                isError,
            };
        }

        throw new Error(`Unknown tool: ${name}`);
    });

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Todomd MCP server running on stdio");
};
