let currentFaceswapImage
let currentSticker
let currentCaption
let captionImage


async function uploadImages() {

    const formData = new FormData(document.getElementById("uploadForm"))

    try {

        const loadingStatus = document.getElementById("loadingStatus")
        loadingStatus.textContent = "Processing..."

        const response = await fetch("/upload", {
            method: "POST",
            body: formData,
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error("Face swap request failed with status:", response.status)
            console.error("Error details:", errorData)
            throw new Error("Face swap request failed")
        }

        const result    = await response.blob()
        const image     = result
        const imageUrl  = URL.createObjectURL(image)

        loadingStatus.textContent = ""

        const canvas    = document.getElementById("resultCanvas")
        const ctx       = canvas.getContext("2d")

        const img   = new Image()
        img.onload  = function () {

            const aspectRatio = img.width / img.height

            if (aspectRatio > 1) {
                canvas.width    = 300
                canvas.height   = 300 / aspectRatio
            } else {
                canvas.width    = 300 * aspectRatio
                canvas.height   = 300
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            currentFaceswapImage = img

            // Block button next1
            document.getElementById("buttonNext1").style.display = "block"
            // Block sticker button
            document.getElementById("buttonsticker").style.display = "none"
            document.getElementById("buttoncaption").style.display = "none"

        }

        img.src = imageUrl

    } catch (error) {

        console.error("Error processing image:", error)
        const loadingStatus       = document.getElementById("loadingStatus")
        loadingStatus.textContent = "Error processing image"
        
    }
}

async function fetchAndPrintResultImage() {
    try {
        // Check if currentFaceswapImage is defined
        if (!currentFaceswapImage || !currentFaceswapImage.src) {
            console.error("currentFaceswapImage is not defined or does not have a valid src.");
            return;
        }
    
        // Extract the pack name from the window location path
        const pathArray = window.location.pathname.split("/");
        const packName = pathArray[pathArray.indexOf("pack") + 1];
    
        if (!packName) {
            console.error("Pack name is missing in the URL path.");
            return;
        }
    
        // Fetch the pack image URL from the server
        const response = await fetch(`/get-pack-image?packName=${packName}`);
    
        if (!response.ok) {
            console.error("Failed to fetch pack image with status:", response.status);
            return;
        }
    
        const packImageUrl = URL.createObjectURL(await response.blob());
    
        // Load the pack image
        const packImageElement = new Image();
        packImageElement.onload = function () {
            currentPackImage = packImageElement;
            const canvas = document.getElementById("resultCanvas");
            const ctx = canvas.getContext("2d");
    
            // Clear the canvas and draw the currentFaceswapImage
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(currentFaceswapImage, 0, 0, canvas.width, canvas.height);
    
            // Calculate the scaled dimensions to fit within the canvas
            const maxWidth = canvas.width;
            const maxHeight = canvas.height * 0.8; // 80% of the canvas height
            const aspectRatio = packImageElement.width / packImageElement.height;
    
            let newWidth = maxWidth;
            let newHeight = maxHeight;
    
            if (aspectRatio > 1) {
            newHeight = maxWidth / aspectRatio;
            } else {
            newWidth = maxHeight * aspectRatio;
            }
    
            // Draw the scaled pack image from the bottom margin
            const yCoordinate = canvas.height - newHeight;
            ctx.drawImage(currentPackImage, 0, yCoordinate, newWidth, newHeight);
    
            // Show the next set of buttons
            document.getElementById("buttonNext1").style.display = "none";
            document.getElementById("buttoncaption").style.display = "block";
        };
    
        packImageElement.src = packImageUrl;
    } catch (error) {
        console.error("Error fetching and printing result image:", error);
    }
}
  
function applyCaption(captionUrl) {
    const canvas = document.getElementById("resultCanvas");
    const ctx = canvas.getContext("2d");
  
    const caption = new Image();
    caption.onload = function () {
      // Simpan gambar dari applyCaption
        captionImage = caption;
    
        // Draw the currentFaceswapImage as a background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentFaceswapImage, 0, 0, canvas.width, canvas.height);
    
        // Draw the currentPackImage with the previously calculated dimensions
        const maxWidth = canvas.width;
        const maxHeight = canvas.height * 0.8; // 80% of the canvas height
        const aspectRatio = currentPackImage.width / currentPackImage.height;
    
        let newWidth = maxWidth;
        let newHeight = maxHeight;
    
        if (aspectRatio > 1) {
            newHeight = maxWidth / aspectRatio;
        } else {
            newWidth = maxHeight * aspectRatio;
        }
    
        const yCoordinate = canvas.height - newHeight;
        ctx.drawImage(currentPackImage, 0, yCoordinate, newWidth, newHeight);
    
        // Draw the new caption on top
        const captionWidth = canvas.width;
        const captionHeight = canvas.height * 0.3;
        const captionX = 0;
        const captionY = 0;
        ctx.drawImage(caption, captionX, captionY, captionWidth, captionHeight);
    
        currentCaption = captionUrl;
    };
  
    caption.src = `/img/caption/${captionUrl}`;
}
  
function nextAction() {
    document.getElementById("buttoncaption").style.display = "none";
    document.getElementById("buttonsticker").style.display = "block";
    document.getElementById("buttonDownload").style.display = "block";
    document.getElementById("buttonShare").style.display = "block";
}
  
function applySticker(stickerUrl) {
    const canvas = document.getElementById("resultCanvas");
    const ctx = canvas.getContext("2d");
  
    const sticker = new Image();
    sticker.onload = function () {
        // Draw the currentFaceswapImage as a background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentFaceswapImage, 0, 0, canvas.width, canvas.height);
    
        // Draw the currentPackImage with the previously calculated dimensions
        const maxWidth = canvas.width;
        const maxHeight = canvas.height * 0.8; // 80% of the canvas height
        const aspectRatio = currentPackImage.width / currentPackImage.height;
    
        let newWidth = maxWidth;
        let newHeight = maxHeight;
    
        if (aspectRatio > 1) {
            newHeight = maxWidth / aspectRatio;
        } else {
            newWidth = maxHeight * aspectRatio;
        }
    
        const yCoordinate = canvas.height - newHeight;
        ctx.drawImage(currentPackImage, 0, yCoordinate, newWidth, newHeight);
    
        // Draw the new sticker on top
        const stickerWidth = canvas.width;
        const stickerHeight = canvas.height * 0.8;
        const stickerX = 0;
        const stickerY = 40;
        ctx.drawImage(sticker, stickerX, stickerY, stickerWidth, stickerHeight);
    
        if (captionImage) {
            const captionWidth = canvas.width;
            const captionHeight = canvas.height * 0.3;
            const captionX = 0;
            const captionY = 0;
            ctx.drawImage(captionImage, captionX, captionY, captionWidth, captionHeight);
        }
    
        currentSticker = stickerUrl;
    };
  
    sticker.src = `/img/sticker/${stickerUrl}`;
}
  
function downloadCanvas() {
    const canvas = document.getElementById("resultCanvas");
    const dataUrl = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = "generated_image.png";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}

function shareCanvas() {
    const canvas = document.getElementById("resultCanvas");
    canvas.toBlob((result) => {

        if (!result) {
            console.error('Cannot create image blob')
            return
        }

        if (!navigator.canShare ) {
            console.error('The browser does not support sharing')
            return
        }
        
        const mime = result.type
        const extension = mime.replace('image/', '')
        const files = [ new File([result], `result.${extension}`, { type: mime }) ]

        if (!navigator.canShare({files: files})) {
            console.error('The browser does not support image sharing')
            return
        }

        navigator.share({ files: files })

    })
}
  
async function uploadRandomImage() {
    try {
        const loadingStatus = document.getElementById("loadingStatus");
        loadingStatus.textContent = "Processing...";
    
        const response = await fetch("/upload?pack=Prawn-Seafood", {
            method: "POST",
        });
    
        const result = await response.json();
        const imageUrl = result.imageUrl;
    
        loadingStatus.textContent = "";
    
        const resultContainer = document.getElementById("result");
        resultContainer.innerHTML = `
            <img src="${imageUrl}" alt="Swapped Faces">
        `;
    
        resultContainer.appendChild(document.createElement("br"));
        const downloadButton = document.createElement("button");
        downloadButton.id = "buttonDownload";
        downloadButton.textContent = "Download Image";
        downloadButton.onclick = function () {
            downloadImage(imageUrl);
        };
        downloadButton.style.display = "none";
    
        resultContainer.appendChild(downloadButton);
    } catch (error) {
        const loadingStatus = document.getElementById("loadingStatus");
        loadingStatus.textContent = "Error processing image";
    }
}
  
function downloadImage(imageUrl) {
    fetch(imageUrl)
        .then((response) => response.blob())
        .then((blob) => {
            const blobUrl = window.URL.createObjectURL(blob);
    
            const anchor = document.createElement("a");
            anchor.href = blobUrl;
            anchor.download = "swapped_faces_image.png";
            document.body.appendChild(anchor);
            anchor.click();
    
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(anchor);
        })
        .catch((error) => {
            console.error("Error downloading image:", error);
        });
  }
  