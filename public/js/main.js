document.addEventListener('DOMContentLoaded', () => {
    // Connect to Socket.IO
    const socket = io();
    
    // Elements
    const highestBidElement = document.getElementById('highest-bid');
    const highestBidderElement = document.getElementById('highest-bidder');
    const bidForm = document.getElementById('bidForm');
    const notificationElement = document.getElementById('notification');
    
    // Listen for current bid updates
    socket.on('currentBid', (data) => {
      highestBidElement.textContent = data.amount;
      highestBidderElement.textContent = data.bidder;
      
      // Update minimum bid amount in the form
      const amountInput = document.getElementById('amount');
      amountInput.min = data.amount + 1;
      
      // Add a visual animation to highlight the change
      highestBidElement.classList.add('highlight');
      highestBidderElement.classList.add('highlight');
      
      setTimeout(() => {
        highestBidElement.classList.remove('highlight');
        highestBidderElement.classList.remove('highlight');
      }, 1500);
    });
    
    // Listen for bid success
    socket.on('bidSuccess', (data) => {
      showNotification(data.message, 'success');
      bidForm.reset();
    });
    
    // Listen for bid errors
    socket.on('bidError', (data) => {
      showNotification(data.message, 'error');
    });
    
    // Submit new bid
    bidForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = {
        fullName: document.getElementById('fullName').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        email: document.getElementById('email').value,
        amount: Number(document.getElementById('amount').value),
        agreementConfirmed: document.getElementById('agreementConfirmed').checked
      };
      
      // Basic client-side validation
      if (!formData.fullName || !formData.phoneNumber || !formData.email || !formData.amount) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }
      
      if (formData.amount <= Number(highestBidElement.textContent)) {
        showNotification(`Your bid must be higher than £${highestBidElement.textContent}`, 'error');
        return;
      }
      
      if (!formData.agreementConfirmed) {
        showNotification('You must agree to the terms before placing a bid', 'error');
        return;
      }
      
      // Send the bid
      socket.emit('newBid', formData);
    });
    
    // Helper to show notifications
    function showNotification(message, type) {
      notificationElement.textContent = message;
      notificationElement.className = 'notification ' + type;
      
      // Auto-hide success messages after 5 seconds
      if (type === 'success') {
        setTimeout(() => {
          notificationElement.style.display = 'none';
        }, 5000);
      }
    }
    
    // Add some additional styling
    document.getElementById('amount').addEventListener('input', function() {
      const currentHighest = Number(highestBidElement.textContent);
      const inputValue = Number(this.value);
      
      if (inputValue <= currentHighest) {
        this.classList.add('invalid');
      } else {
        this.classList.remove('invalid');
      }
    });
  });