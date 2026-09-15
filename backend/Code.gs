// Set this to your actual email address where you want to receive admin notifications
var ADMIN_EMAIL = "attarsahil9999@gmail.com";

function doPost(e) {
  // Add CORS headers so your frontend can call this script
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    // Parse the incoming JSON data from checkout.js
    var orderData = JSON.parse(e.postData.contents);
    
    // 1. Send Admin Email
    sendAdminEmail(orderData);
    
    // 2. Send Customer Email
    if (orderData.email && orderData.email.trim() !== "") {
      sendCustomerEmail(orderData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "message": "Emails sent successfully"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "message": error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle OPTIONS request for CORS preflight
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
}

function sendAdminEmail(order) {
  var subject = "New Order Received: #" + order.orderId;
  
  var itemsHtml = "";
  order.items.forEach(function(item) {
    itemsHtml += "<li>" + item.id + " x " + item.quantity + "</li>";
  });
  
  var htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
      <h2 style="color: #b8904a;">New Order Notification</h2>
      <p><strong>Order ID:</strong> ${order.orderId}</p>
      <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
      <hr>
      <h3>Customer Details:</h3>
      <p><strong>Name:</strong> ${order.customer}</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>Email:</strong> ${order.email || 'N/A'}</p>
      <p><strong>Address:</strong><br>${order.address}<br>${order.city}, ${order.state} ${order.pincode}</p>
      <hr>
      <h3>Order Summary:</h3>
      <ul>${itemsHtml}</ul>
      <p><strong>Subtotal:</strong> ${order.subtotal}</p>
      <p><strong>Shipping:</strong> ${order.shipping}</p>
      <p><strong>Discount:</strong> ${order.discount} ${order.couponCode ? '(' + order.couponCode + ')' : ''}</p>
      <h3 style="color: #151515;">Total: ${order.total}</h3>
      <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
    </div>
  `;
  
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: subject,
    htmlBody: htmlBody
  });
}

function sendCustomerEmail(order) {
  var subject = "Order Confirmation - Aurelia Fragrances #" + order.orderId;
  
  var itemsHtml = "";
  order.items.forEach(function(item) {
    itemsHtml += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.id}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      </tr>
    `;
  });
  
  var htmlBody = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f5ef; padding: 40px 20px;">
      <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="letter-spacing: 0.18em; font-weight: 700; color: #151515; margin: 0;">AURELIA</h1>
        </div>
        
        <h2 style="color: #151515; font-size: 24px; margin-bottom: 10px;">Thank you for your order, ${order.customer}!</h2>
        <p style="color: #6d6a64; line-height: 1.6;">We've received your order and are getting it ready for dispatch. You have selected <strong>${order.paymentMethod}</strong>.</p>
        
        <div style="background-color: #f8f5ef; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <p style="margin: 0 0 5px 0; color: #6d6a64; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
          <h3 style="margin: 0; color: #151515; font-size: 20px;">#${order.orderId}</h3>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #151515; color: #151515;">Item</th>
              <th style="text-align: center; padding: 10px; border-bottom: 2px solid #151515; color: #151515;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: #6d6a64;">Subtotal</td>
            <td style="padding: 5px 0; text-align: right; color: #151515;">${order.subtotal}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #6d6a64;">Shipping</td>
            <td style="padding: 5px 0; text-align: right; color: #151515;">${order.shipping}</td>
          </tr>
          ${order.discount !== '₹0.00' ? `
          <tr>
            <td style="padding: 5px 0; color: #28a745;">Discount ${order.couponCode ? '('+order.couponCode+')' : ''}</td>
            <td style="padding: 5px 0; text-align: right; color: #28a745;">-${order.discount}</td>
          </tr>
          ` : ''}
          <tr>
            <td colspan="2" style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 10px;"></td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-weight: bold; font-size: 18px; color: #151515;">Total</td>
            <td style="padding: 5px 0; text-align: right; font-weight: bold; font-size: 18px; color: #151515;">${order.total}</td>
          </tr>
        </table>
        
        <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #eee; text-align: center;">
          <h4 style="margin: 0 0 10px 0; color: #151515;">Shipping Address</h4>
          <p style="margin: 0; color: #6d6a64; line-height: 1.5;">
            ${order.address}<br>
            ${order.city}, ${order.state} ${order.pincode}
          </p>
        </div>
        
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6d6a64; font-size: 12px;">
        <p>&copy; 2026 Aurelia Fragrances. All rights reserved.</p>
      </div>
    </div>
  `;
  
  MailApp.sendEmail({
    to: order.email,
    subject: subject,
    htmlBody: htmlBody
  });
}
