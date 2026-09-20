document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeBtn');
    const sidebar = document.getElementById('sidebar');

    const canvasElement= document.getElementById('pie-chart');
    let config = {
  type: 'pie', // Added the chart type so Chart.js knows it's a pie chart
  data: {
    labels: ['Food', 'Entertainment', 'Bills'],
    datasets: [{
      label: 'Spending Overview', 
      data:[250,1000,5000],
      backgroundColor: [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 205, 86)'
      ],
      hoverOffset: 4
    }]
  }
};


    let pie= new Chart(canvasElement,config);

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