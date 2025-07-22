const auctionList = document.getElementById('auctionList');
const modal = document.getElementById('itemModal');
const modalContent = document.getElementById('modalContent');
const closeBtn = document.getElementsByClassName('close')[0];
const searchInput = document.getElementById('searchInput');
const filterButton = document.getElementById('filterButton');
const filterMenu = document.getElementById('filterMenu');
const filterSelect = document.getElementById('filterSelect');
const applyFilterButton = document.getElementById('applyFilter');

let allAuctions = [];

function createAuctionItem(item) {
    const auctionItem = document.createElement('div');
    auctionItem.classList.add('auction-item');
    auctionItem.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <h2>${item.title}</h2>
        <span class="current-bid">Current Bid: $${item.currentBid.toLocaleString()}</span>
    `;
    auctionItem.onclick = () => showItemDetails(item);
    return auctionItem;
}

function showItemDetails(item) {
    modalContent.innerHTML = `
        <img src="${item.image}" alt="${item.title}" class="modal-image">
        <h2>${item.title}</h2>
        <p class="modal-description">${item.description}</p>
        <p class="current-bid">Current Bid: $${item.currentBid.toLocaleString()}</p>
        <button onclick="placeBid(${item.id})">Place Bid</button>
    `;
    modal.style.display = 'block';
}

closeBtn.onclick = () => {
    modal.style.display = 'none';
}

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

async function fetchAuctions() {
    try {
        const response = await fetch('/auctions');
        allAuctions = await response.json();
        updateAuctionDisplay(allAuctions);
    } catch (error) {
        console.error('Error fetching auctions:', error);
    }
}

function updateAuctionDisplay(auctions) {
    auctionList.innerHTML = '';
    auctions.forEach((auction) => {
        const auctionItem = createAuctionItem(auction);
        auctionList.appendChild(auctionItem);
    });
}

function placeBid(id) {
    showBidInputPopup(id);
}

function showBidInputPopup(id) {
    const popup = document.getElementById('bidInputPopup');
    const bidInput = document.getElementById('bidInput');
    const bidderNameInput = document.getElementById('bidderNameInput');
    const submitBtn = document.getElementById('submitBid');
    const cancelBtn = document.getElementById('cancelBid');

    popup.style.display = 'block';
    bidInput.value = '';
    bidderNameInput.value = localStorage.getItem('bidderName') || '';
    bidInput.focus();

    submitBtn.onclick = async () => {
        const bidAmount = parseFloat(bidInput.value);
        const bidderName = bidderNameInput.value.trim();
        if (bidAmount && bidAmount > 0 && bidderName) {
            localStorage.setItem('bidderName', bidderName);
            popup.style.display = 'none';
            await submitBid(id, bidAmount, bidderName);
        } else {
            showPopup('Error', 'Please enter a valid bid amount and your name.');
        }
    };

    cancelBtn.onclick = () => {
        popup.style.display = 'none';
    };

    bidInput.onkeyup = (event) => {
        if (event.key === 'Enter') {
            submitBtn.click();
        }
    };
}

async function submitBid(id, bidAmount, bidderName) {
    try {
        const response = await fetch(`/auctions/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ currentBid: bidAmount, bidderName: bidderName }),
        });
        if (response.ok) {
            await fetchAuctions();
            modal.style.display = 'none';
            showPopup('Success', 'Your bid has been placed successfully!');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to place bid');
        }
    } catch (error) {
        console.error('Error placing bid:', error);
        showPopup('Error', error.message);
    }
}

function showPopup(title, message) {
    const popup = document.getElementById('customPopup');
    const popupTitle = document.getElementById('popupTitle');
    const popupMessage = document.getElementById('popupMessage');
    
    popupTitle.textContent = title;
    popupMessage.textContent = message;
    popup.style.display = 'block';
}

function closePopup() {
    const popup = document.getElementById('customPopup');
    popup.style.display = 'none';
}

function searchAndFilterAuctions() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;

    const filteredAuctions = allAuctions.filter(auction => {
        const matchesSearch = auction.title.toLowerCase().includes(searchTerm) || 
                              auction.description.toLowerCase().includes(searchTerm);
        const matchesFilter = filterValue === 'all' || auction.category === filterValue;
        return matchesSearch && matchesFilter;
    });

    updateAuctionDisplay(filteredAuctions);
}

filterButton.addEventListener('click', () => {
    filterMenu.style.display = filterMenu.style.display === 'block' ? 'none' : 'block';
});

applyFilterButton.addEventListener('click', () => {
    searchAndFilterAuctions();
    filterMenu.style.display = 'none';
});

document.addEventListener('DOMContentLoaded', () => {
    fetchAuctions();
    document.getElementById('popupClose').addEventListener('click', closePopup);
    searchInput.addEventListener('input', searchAndFilterAuctions);
    filterSelect.addEventListener('change', searchAndFilterAuctions);
});

// Close filter menu when clicking outside
document.addEventListener('click', (event) => {
    if (!filterButton.contains(event.target) && !filterMenu.contains(event.target)) {
        filterMenu.style.display = 'none';
    }
});

setInterval(fetchAuctions, 7000);
