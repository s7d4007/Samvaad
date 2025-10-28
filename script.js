document.addEventListener('DOMContentLoaded', function () {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.addEventListener('click', function (event) {
            event.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        window.addEventListener('click', function (event) {
            if (dropdownMenu.classList.contains('show') && !dropdownToggle.contains(event.target)) {
                dropdownMenu.classList.remove('show');
            }
        });

        dropdownMenu.addEventListener('click', function (event) {
            if (event.target.classList.contains('dropdown-item')) {
                // You can add functionality for clear/export here
                console.log(event.target.textContent + ' clicked');
                dropdownMenu.classList.remove('show');
            }
        });
    }
});
