const stars = document.querySelectorAll('.rating .star');

stars.forEach((star, index) => {
    star.addEventListener('click', () => {

        stars.forEach(s => s.classList.remove('active'));

        for (let i = 0; i <= index; i++) {
            stars[i].classList.add('active');
        }
    });
});
