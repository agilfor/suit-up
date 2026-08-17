function start_stream() {
    const video = document.getElementById("cameo");// as HTMLVideoElement | null;
    if (navigator.mediaDevices.getUserMedia && video instanceof HTMLVideoElement) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                if (video && stream) { video.srcObject = stream; }

            })
            .catch((err) => {
                console.error(`Error opening camera: ${err}`)
            })
    } else {
        // do something to stop the rest of the script
    }
}

document.addEventListener("DOMContentLoaded", () => {
    start_stream();
})