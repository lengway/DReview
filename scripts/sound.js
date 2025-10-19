export function playSound() {
    const sound = new Audio('/../../images/notify.wav');
    sound.currentTime = 0;
    sound.play();
}