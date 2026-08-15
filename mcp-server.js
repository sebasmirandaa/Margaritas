const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || 'margaritas-admin-secret-key-123';
const PORT = process.env.PORT || 8080;
const API_URL = `http://localhost:${PORT}/api/admin/products`;

const server = new Server({
    name: "margaritas-admin-mcp",
    version: "1.0.0"
}, {
    capabilities: {
        tools: {}
    }
});

// Generate an admin token for API calls
function getAdminToken() {
    return jwt.sign({ username: 'mcp-agent', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_products",
                description: "Retrieves the current list of products from the Margaritas catalog.",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            },
            {
                name: "create_product",
                description: "Creates a new product in the Margaritas catalog.",
                inputSchema: {
                    type: "object",
                    properties: {
                        title: { type: "string", description: "Name of the bouquet/product" },
                        price: { type: "number", description: "Final price in Guaranies (Gs)" },
                        oldPrice: { type: "number", description: "Old/original price before discount (optional)" },
                        tag: { type: "string", description: "Season tag: Primavera, Verano, Otoño, or Invierno" },
                        img: { type: "string", description: "Optional path to image, e.g. assets/f-amarillas.png. If omitted, a default image should be used." }
                    },
                    required: ["title", "price", "tag"]
                }
            },
            {
                name: "update_product",
                description: "Updates an existing product in the Margaritas catalog.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: { type: "number", description: "ID of the product to update" },
                        title: { type: "string", description: "New name of the bouquet/product" },
                        price: { type: "number", description: "New final price in Guaranies (Gs)" },
                        oldPrice: { type: "number", description: "New old/original price. Use null to remove the discount." },
                        tag: { type: "string", description: "Season tag: Primavera, Verano, Otoño, or Invierno" },
                        img: { type: "string", description: "New path to image" }
                    },
                    required: ["id"]
                }
            },
            {
                name: "delete_product",
                description: "Deletes a product from the Margaritas catalog by ID.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: { type: "number", description: "ID of the product to delete" }
                    },
                    required: ["id"]
                }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const token = getAdminToken();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    try {
        if (request.params.name === "get_products") {
            const res = await fetch(API_URL, { headers });
            const data = await res.json();
            return {
                content: [{ type: "text", text: JSON.stringify(data.products || data, null, 2) }]
            };
        }

        if (request.params.name === "create_product") {
            const product = { ...request.params.arguments };
            if (!product.img) product.img = 'assets/placeholder.png';
            
            const res = await fetch(API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify({ action: 'create', product })
            });
            const data = await res.json();
            return {
                content: [{ type: "text", text: data.success ? "Product created successfully." : `Failed: ${data.error}` }]
            };
        }

        if (request.params.name === "update_product") {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify({ action: 'update', product: request.params.arguments })
            });
            const data = await res.json();
            return {
                content: [{ type: "text", text: data.success ? "Product updated successfully." : `Failed: ${data.error}` }]
            };
        }

        if (request.params.name === "delete_product") {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers,
                body: JSON.stringify({ action: 'delete', product: { id: request.params.arguments.id } })
            });
            const data = await res.json();
            return {
                content: [{ type: "text", text: data.success ? "Product deleted successfully." : `Failed: ${data.error}` }]
            };
        }

        throw new Error("Tool not found");
    } catch (error) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);
