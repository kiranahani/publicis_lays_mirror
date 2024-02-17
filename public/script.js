const FaceswapImage = new Image
const PackImage = new Image
const StickerImage = new Image
const CaptionImage = new Image

const canvas    = document.getElementById("resultCanvas")
const context   = canvas.getContext('2d');

let canvasAdjusted = false

function render() {
    
    context.clearRect(0, 0, canvas.width, canvas.height)

    renderFace(300, 300)

    const maxWidth  = canvas.width
    const maxHeight = canvas.height

    renderPack(maxWidth, maxHeight)
    renderCaption(maxWidth, maxHeight)
    renderSticker(maxWidth, maxHeight)

}

function renderFace(maxWidth = 300, maxHeight = 300) {

    if (!FaceswapImage.src) {
        return
    }
    
    if (!canvasAdjusted) {
        const aspectRatio = FaceswapImage.width / FaceswapImage.height
        if (aspectRatio > 1) {
            canvas.width    = maxWidth
            canvas.height   = maxHeight / aspectRatio
        } else {
            canvas.width    = maxWidth * aspectRatio
            canvas.height   = maxHeight
        }

        canvasAdjusted = true
    }

    context.drawImage(FaceswapImage, 0, 0, canvas.width, canvas.height)

}

function renderPack(maxWidth, maxHeight) {

    if (!PackImage.src) {
        return
    }

    let newWidth    = maxWidth
    let newHeight   = maxHeight * 0.8

    const aspectRatio = PackImage.width / PackImage.height
    if (aspectRatio > 1) {
        newHeight = maxWidth / aspectRatio
    } else {
        newWidth = maxHeight * aspectRatio
    }

    const yCoordinate = canvas.height - newHeight
    context.drawImage(PackImage, 0, yCoordinate, newWidth, newHeight)
}

function renderCaption(maxWidth, maxHeight) {

    if (!CaptionImage.src) {
        return
    }

    const width = maxWidth
    const height = maxHeight * 0.3

    context.drawImage(CaptionImage, 0, 0, width, height)

}

function renderSticker(maxWidth, maxHeight) {

    if (!StickerImage.src) {
        return
    }

    const width     = maxWidth
    const height    = maxHeight * 0.8

    context.drawImage(StickerImage, 0, 40, width, height)

}

[FaceswapImage, PackImage, StickerImage, CaptionImage].forEach((image) => {
    image.addEventListener('load', event => {
        render()
    })
})


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

        FaceswapImage.src = imageUrl

        // Show button next1
        document.getElementById("buttonpack").style.display = "block"

    } catch (error) {

        console.error("Error processing image:", error)
        const loadingStatus       = document.getElementById("loadingStatus")
        loadingStatus.textContent = "Error processing image"
        
    }
}

function applyPack(packUrl) {
    PackImage.src = `/img/pack/${packUrl}`
}
  
function applyCaption(captionUrl) {
    CaptionImage.src = `/img/caption/${captionUrl}`;
}

function navigateToCaption() {
    document.getElementById('buttonpack').style.display = 'none'
    document.getElementById('buttoncaption').style.display = 'block'
}

function nextAction() {
    document.getElementById("buttoncaption").style.display = "none";
    document.getElementById("buttonsticker").style.display = "block";
    document.getElementById("buttonDownload").style.display = "block";
    document.getElementById("buttonShare").style.display = "block";
}
  
function applySticker(stickerUrl) {
    StickerImage.src = `/img/sticker/${stickerUrl}`;
}
  
function downloadCanvas() {
    const dataUrl = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = "generated_image.png";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}

function shareCanvas() {
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
  