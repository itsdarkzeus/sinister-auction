let currentAuctionId = null;
const updateInterval = 5000; // Update every 5 seconds

async function fetchWithAuth(url, options = {}) {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        window.location.href = '/login.html';
        return;
    }
    
    const headers = new Headers(options.headers || {});
    headers.append('Authorization', sessionId);
    
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
        window.location.href = '/login.html';
        return;
    }
    
    return response;
}

async function fetchAuctions() {
    try {
        const response = await fetchWithAuth('/admin/auctions');
        if (response) {
            const auctions = await response.json();
            updateAuctions(auctions);
        }
    } catch (error) {
        console.error('Error fetching auctions:', error);
    }
}


function updateAuctions(auctions) {
    const auctionList = document.getElementById('auctionList');
    
    if (currentAuctionId === null) {
        auctions.forEach(auction => {
            let auctionElement = document.getElementById(`auction-${auction.id}`);
            if (!auctionElement) {
                auctionElement = document.createElement('div');
                auctionElement.id = `auction-${auction.id}`;
                auctionElement.className = 'auction-card';
                auctionElement.innerHTML = `
                    <h2>${auction.title}</h2>
                    <p>Current Bid: $<span class="bid-amount" data-value="${auction.currentBid}">0</span></p>
                    <p>Highest Bidder: <span class="highest-bidder">${auction.highestBidder || 'No bids yet'}</span></p>
                    <button onclick="viewBids(${auction.id})">View All Bids</button>
                `;
                auctionList.appendChild(auctionElement);
            }
            updateAuctionCard(auctionElement, auction);
        });
    }
}

function updateAuctionCard(element, auction) {
    const bidAmountElement = element.querySelector('.bid-amount');
    const highestBidderElement = element.querySelector('.highest-bidder');
    
    animateValue(bidAmountElement, parseFloat(bidAmountElement.dataset.value), auction.currentBid, 1000);
    bidAmountElement.dataset.value = auction.currentBid;
    
    if (highestBidderElement.textContent !== (auction.highestBidder || 'No bids yet')) {
        highestBidderElement.textContent = auction.highestBidder || 'No bids yet';
        highestBidderElement.classList.add('highlight');
        setTimeout(() => highestBidderElement.classList.remove('highlight'), 1000);
    }
}

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        element.textContent = current.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

//function logout() {
  //  localStorage.removeItem('sessionId');
  //  window.location.href = '/login.html';
//}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        window.location.href = '/login.html';
    } else {
        fetchAuctions();
    }
});

async function viewBids(auctionId) {
    currentAuctionId = auctionId;
    await fetchAndDisplayBids(auctionId);
}

async function fetchAndDisplayBids(auctionId) {
    try {
        const response = await fetch(`/auctions/${auctionId}`);
        const auction = await response.json();
        displayBids(auction);
    } catch (error) {
        console.error('Error fetching auction details:', error);
    }
}

async function logout() {
    try {
        await fetchWithAuth('/logout', { method: 'POST' });
        localStorage.removeItem('sessionId');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}



function displayBids(auction) {
    const auctionList = document.getElementById('auctionList');
    auctionList.innerHTML = `
        <div id="bidsView">
            <h2>${auction.title} - All Bids</h2>
            <table>
                <tr>
                    <th>Bidder</th>
                    <th>Amount</th>
                    <th>Time</th>
                </tr>
                ${auction.bids.map(bid => `
                    <tr>
                        <td>${bid.bidder}</td>
                        <td>$${bid.amount.toLocaleString()}</td>
                        <td>${new Date(bid.time).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </table>
            <button class="back-button" onclick="backToAuctions()">Back to Auctions</button>
        </div>
    `;
}

function backToAuctions() {
    currentAuctionId = null;
    const auctionList = document.getElementById('auctionList');
    auctionList.innerHTML = ''; // Clear the bids view
    fetchAuctions();
}

function startAutoUpdate() {
    setInterval(() => {
        if (currentAuctionId === null) {
            fetchAuctions();
        } else {
            fetchAndDisplayBids(currentAuctionId);
        }
    }, updateInterval);
}

// Initial fetch of auctions
fetchAuctions();

// Start auto-update
startAutoUpdate();
