const fs = require('fs-extra');
const ejs = require('ejs');

class ReportGenerator {
    static HTML_TEMPLATE = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Test Results</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.23.0/themes/prism-okaidia.min.css" rel="stylesheet" />
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 20px;
            }
            table {
                border-collapse: collapse;
                width: 100%;
                box-shadow: 0 2px 3px rgba(0,0,0,0.1);
            }
            th, td {
                border: 1px solid #ddd;
                text-align: left;
                padding: 8px;
            }
            th {
                background-color: #f2f2f2;
            }
            tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            .status-pass {
                color: green;
            }
            .status-fail {
                color: red;
            }
            pre {
                background-color: #000000 !important;
                color: #ffffff !important;
                padding: 5px;
                border-radius: 5px;
            }
        </style>
    </head>
    <body>
        <table>
            <tr>
                <th>Status</th>
                <th>Reason</th>
                <th>Exit Code</th>
                <th>Stderr</th>
                <th>Stdout</th>
                <th>Test</th>
            </tr>
            <% results.forEach(result => { %>
            <tr>
                <td class="status-<%= result.status %>"><%= result.status %></td>
                <td><%= result.reason %></td>
                <td><%= result.exit_code %></td>
                <td><% if (result.stderr) { %><pre><code class="language-shell"><%= result.stderr %></code></pre><% } else { %>&nbsp;<% } %></td>
                <td><% if (result.stdout) { %><pre><code class="language-shell"><%= result.stdout %></code></pre><% } else { %>&nbsp;<% } %></td>
                <td><% if (result.test) { %><pre><code class="language-python"><%= result.test %></code></pre><% } else { %>&nbsp;<% } %></td>
            </tr>
            <% }); %>
        </table>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.23.0/prism.min.js"></script>
    </body>
    </html>
    `;

    static async generateReport(results, filePath) {
        try {
            const htmlContent = ejs.render(this.HTML_TEMPLATE, { results });
            await fs.writeFile(filePath, htmlContent);
            console.log(`Report generated and saved to ${filePath}`);
        } catch (error) {
            console.error(`Error generating report: ${error.message}`);
        }
    }
}

module.exports = ReportGenerator;
