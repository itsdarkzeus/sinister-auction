const submitForm = document.getElementById('submitForm');
const dropZone = document.getElementById('dropZone');
const imageUpload = document.getElementById('imageUpload');

dropZone.addEventListener('click', () => imageUpload.click());

imageUpload.addEventListener('change', handleFileSelect);

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropZone.classList.add('drop-zone--over');
}

function unhighlight() {
    dropZone.classList.remove('drop-zone--over');
}

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        previewFile(file);
    }
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        previewFile(file);
    }
}

function previewFile(file) {
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            const img = document.createElement('div');
            img.classList.add('drop-zone__thumb');
            img.style.backgroundImage = `url('${reader.result}')`;
            img.setAttribute('data-label', file.name);
            dropZone.innerHTML = '';
            dropZone.appendChild(img);
        }
    } else {
        alert('Please upload an image file.');
    }
}

submitForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const itemName = document.getElementById('itemName').value;
    const itemDescription = document.getElementById('itemDescription').value;
    const startingBid = parseFloat(document.getElementById('startingBid').value);
    const imageFile = imageUpload.files[0];

    if (itemName && itemDescription && startingBid && imageFile) {
        const formData = new FormData();
        formData.append('title', itemName);
        formData.append('description', itemDescription);
        formData.append('currentBid', startingBid);
        formData.append('image', imageFile);

        try {
            const response = await fetch('/auctions', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                alert('Item submitted successfully!');
                submitForm.reset();
                dropZone.innerHTML = '<span class="drop-zone__prompt">Drop image here or click to upload</span>';
            } else {
                throw new Error('Failed to submit item');
            }
        } catch (error) {
            alert('Error submitting item: ' + error.message);
        }
    } else {
        alert('Please fill in all fields and upload an image.');
    }
});
