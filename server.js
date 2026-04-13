const express = require('express');
const bodyParser = require('body-parser');
const { simpleParser } = require('mailparser');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for demo (in production, use a database)
const receipts = [];
const userForwardingAddress = `receipts-${Math.random().toString(36).substring(7)}@receipt-forward.app`;

app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/plain' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware for parsing email webhooks
app.use('/api/webhook/email', bodyParser.raw({ type: 'message/rfc822', limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Homepage
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt Forward - Easy Expense Tracking</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        header {
            text-align: center;
            color: white;
            padding: 40px 20px;
        }
        
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .tagline {
            font-size: 1.2em;
            opacity: 0.9;
        }
        
        .price {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 25px;
            margin-top: 15px;
            font-weight: bold;
        }
        
        .main-content {
            background: white;
            border-radius: 15px;
            padding: 40px;
            margin-top: 30px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        
        .forward-address {
            background: #f7f9fc;
            border: 2px dashed #667eea;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        
        .forward-address h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .email-address {
            font-size: 1.3em;
            font-weight: bold;
            color: #333;
            background: white;
            padding: 15px;
            border-radius: 5px;
            display: inline-block;
            margin-top: 10px;
        }
        
        .demo-section {
            margin-top: 40px;
        }
        
        .demo-section h2 {
            color: #333;
            margin-bottom: 20px;
        }
        
        .demo-form {
            background: #f7f9fc;
            padding: 25px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-weight: 500;
        }
        
        input, select, textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 5px;
            font-size: 1em;
            transition: border-color 0.3s;
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        button {
            background: #667eea;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            font-size: 1em;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        button:hover {
            background: #5568d3;
        }
        
        .receipts-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .receipts-table th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
        }
        
        .receipts-table td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .receipts-table tr:hover {
            background: #f7f9fc;
        }
        
        .category-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 0.85em;
            font-weight: 500;
        }
        
        .category-office { background: #e3f2fd; color: #1976d2; }
        .category-travel { background: #f3e5f5; color: #7b1fa2; }
        .category-meals { background: #fff3e0; color: #e65100; }
        .category-software { background: #e8f5e9; color: #2e7d32; }
        .category-other { background: #f5f5f5; color: #616161; }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .feature {
            background: #f7f9fc;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        
        .feature-icon {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .export-btn {
            background: #2e7d32;
            margin-top: 20px;
        }
        
        .export-btn:hover {
            background: #1b5e20;
        }

        .success-message {
            background: #4caf50;
            color: white;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📧 Receipt Forward</h1>
            <p class="tagline">Automatically extract and categorize your expenses</p>
            <div class="price">$12/month</div>
        </header>
        
        <div class="main-content">
            <div class="forward-address">
                <h3>Your Dedicated Forwarding Address</h3>
                <p>Forward all your email receipts to:</p>
                <div class="email-address">${userForwardingAddress}</div>
            </div>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🔍</div>
                    <h3>Auto Extract</h3>
                    <p>Automatically extracts amounts, vendors, and dates</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">📊</div>
                    <h3>Categorize</h3>
                    <p>Smart categorization for tax time</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">📈</div>
                    <h3>Export</h3>
                    <p>Download as CSV for your accountant</p>
                </div>
            </div>
            
            <div class="demo-section">
                <h2>Try It Out - Simulate a Receipt</h2>
                <div id="successMessage" class="success-message">Receipt processed successfully!</div>
                <form class="demo-form" id="receiptForm">
                    <div class="form-group">
                        <label for="vendor">Vendor/Merchant</label>
                        <input type="text" id="vendor" name="vendor" placeholder="Amazon, Starbucks, Delta Airlines..." required>
                    </div>
                    <div class="form-group">
                        <label for="amount">Amount ($)</label>
                        <input type="number" id="amount" name="amount" step="0.01" placeholder="49.99" required>
                    </div>
                    <div class="form-group">
                        <label for="category">Category</label>
                        <select id="category" name="category">
                            <option value="Office Supplies">Office Supplies</option>
                            <option value="Travel">Travel</option>
                            <option value="Meals & Entertainment">Meals & Entertainment</option>
                            <option value="Software & Services">Software & Services</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="description">Description (Optional)</label>
                        <textarea id="description" name="description" rows="2" placeholder="What was this purchase for?"></textarea>
                    </div>
                    <button type="submit">Process Receipt</button>
                </form>
            </div>
            
            <div class="demo-section">
                <h2>Your Receipts</h2>
                <table class="receipts-table" id="receiptsTable">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Vendor</th>
                            <th>Amount</th>
                            <th>Category</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody id="receiptsBody">
                        <tr>
                            <td colspan="5" style="text-align: center; color: #999;">No receipts yet. Add one above to get started!</td>
                        </tr>
                    </tbody>
                </table>
                <button class="export-btn" id="exportBtn">📥 Export to CSV</button>
            </div>
        </div>
    </div>
    
    <script>
        const form = document.getElementById('receiptForm');
        const receiptsBody = document.getElementById('receiptsBody');
        const exportBtn = document.getElementById('exportBtn');
        const successMessage = document.getElementById('successMessage');
        
        function getCategoryClass(category) {
            const map = {
                'Office Supplies': 'category-office',
                'Travel': 'category-travel',
                'Meals & Entertainment': 'category-meals',
                'Software & Services': 'category-software',
                'Other': 'category-other'
            };
            return map[category] || 'category-other';
        }
        
        function formatCurrency(amount) {
            return '$' + parseFloat(amount).toFixed(2);
        }
        
        function loadReceipts() {
            fetch('/api/receipts')
                .then(res => res.json())
                .then(data => {
                    if (data.receipts.length === 0) {
                        receiptsBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No receipts yet. Add one above to get started!</td></tr>';
                        return;
                    }
                    
                    receiptsBody.innerHTML = data.receipts.map(receipt => `
                        <tr>
                            <td>${new Date(receipt.date).toLocaleDateString()}</td>
                            <td>${receipt.vendor}</td>
                            <td>${formatCurrency(receipt.amount)}</td>
                            <td><span class="category-badge ${getCategoryClass(receipt.category)}">${receipt.category}</span></td>
                            <td>${receipt.description || '-'}</td>
                        </tr>
                    `).join('');
                });
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                vendor: document.getElementById('vendor').value,
                amount: document.getElementById('amount').value,
                category: document.getElementById('category').value,
                description: document.getElementById('description').value
            };
            
            const response = await fetch('/api/receipts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                successMessage.style.display = 'block';
                setTimeout(() => { successMessage.style.display = 'none'; }, 3000);
                form.reset();
                loadReceipts();
            }
        });
        
        exportBtn.addEventListener('click', () => {
            window.location.href = '/api/export';
        });
        
        // Load receipts on page load
        loadReceipts();
    </script>
</body>
</html>
  `);
});

// API: Get all receipts
app.get('/api/receipts', (req, res) => {
  res.json({ receipts: receipts.sort((a, b) => new Date(b.date) - new Date(a.date)) });
});

// API: Add a receipt
app.post('/api/receipts', (req, res) => {
  const { vendor, amount, category, description } = req.body;
  
  const receipt = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    vendor,
    amount: parseFloat(amount),
    category,
    description: description || ''
  };
  
  receipts.push(receipt);
  res.json({ success: true, receipt });
});

// API: Export to CSV
app.get('/api/export', (req, res) => {
  const csv = [
    ['Date', 'Vendor', 'Amount', 'Category', 'Description'],
    ...receipts.map(r => [
      new Date(r.date).toLocaleDateString(),
      r.vendor,
      r.amount.toFixed(2),
      r.category,
      r.description
    ])
  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=receipts.csv');
  res.send(csv);
});

// API: Webhook for receiving forwarded emails (simulated)
app.post('/api/webhook/email', async (req, res) => {
  try {
    // In production, this would parse actual email from services like SendGrid, Mailgun, etc.
    const emailText = req.body.toString();
    
    // Simple extraction logic (in production, use NLP/regex patterns)
    const amountMatch = emailText.match(/\$?(\d+\.\d{2})/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    const receipt = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      vendor: 'Email Receipt',
      amount: amount,
      category: 'Other',
      description: 'Forwarded from email'
    };
    
    receipts.push(receipt);
    res.json({ success: true, receipt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Receipt Forward app listening on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to get started`);
});