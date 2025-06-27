export interface PDFContent {
  contractName: string;
  contractAddress: string;
  transactionHash: string;
  sourceCode: string;
  verificationInstructions: string;
  features: string[];
  deploymentDate: string;
}

export class PDFGenerator {
  generateContractPDF(content: PDFContent): string {
    // In a real implementation, this would use a PDF library like puppeteer or jsPDF
    // For now, we'll return HTML that can be converted to PDF
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Smart Contract - ${content.contractName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .code { background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; white-space: pre-wrap; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table th, .info-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .info-table th { background-color: #f2f2f2; }
        .feature-list { list-style-type: none; padding: 0; }
        .feature-list li { background: #e8f4fd; margin: 5px 0; padding: 10px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Smart Contract Documentation</h1>
        <h2>${content.contractName}</h2>
        <p>Generated on ${content.deploymentDate}</p>
    </div>

    <div class="section">
        <h3>Contract Information</h3>
        <table class="info-table">
            <tr><th>Contract Name</th><td>${content.contractName}</td></tr>
            <tr><th>Contract Address</th><td>${content.contractAddress}</td></tr>
            <tr><th>Transaction Hash</th><td>${content.transactionHash}</td></tr>
            <tr><th>Network</th><td>Polygon Mainnet</td></tr>
            <tr><th>Deployment Date</th><td>${content.deploymentDate}</td></tr>
        </table>
    </div>

    <div class="section">
        <h3>Selected Features</h3>
        <ul class="feature-list">
            ${content.features.map(feature => `<li>${feature.toUpperCase()}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h3>Contract Source Code</h3>
        <div class="code">${content.sourceCode}</div>
    </div>

    <div class="section">
        <h3>Verification Instructions</h3>
        <div class="code">${content.verificationInstructions}</div>
    </div>

    <div class="section">
        <h3>Important Links</h3>
        <ul>
            <li><a href="https://polygonscan.com/address/${content.contractAddress}">View on PolygonScan</a></li>
            <li><a href="https://polygonscan.com/tx/${content.transactionHash}">View Transaction</a></li>
        </ul>
    </div>
</body>
</html>
    `;
  }
}

export const pdfGenerator = new PDFGenerator();
