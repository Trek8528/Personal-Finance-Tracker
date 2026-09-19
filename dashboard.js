document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeBtn');
    const sidebar = document.getElementById('sidebar');

    function toggleSidebar() {
        console.log("Hi lol")
        sidebar.classList.toggle('active');
        document.body.classList.toggle('sidebar-open');
    }

    if (menuBtn && closeBtn && sidebar) {
        menuBtn.addEventListener('click', toggleSidebar);
        closeBtn.addEventListener('click', toggleSidebar);
    } else {
        console.error('Sidebar or button elements not found in DOM.');
    }
});