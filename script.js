document.addEventListener("DOMContentLoaded", () => {
  const signupform = document.querySelector(".signup form");
  const loginform = document.querySelector(".login form");
  const errormsg = document.querySelector(".error-msg");
  const showError = (input, message) => {
    let errorElement = input.parentElement.querySelector(".error-msg");
    if (!errorElement) {
      errorElement = document.createElement("small");
      errorElement.className = "error-msg";
      errorElement.style.color = "#e74c3c";
      errorElement.style.fontSize = "12px";
      errorElement.style.display = "block";
      errorElement.style.marginTop = "4px";
      input.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = message;
    input.style.borderColor = "#e74c3c";
  };

  if (signupform) {
    const fname = document.querySelector("#firstname");
    const lname = document.querySelector("#lastname");
    const phone = document.querySelector("#phone");
    const email = document.querySelector("#email");
    const password = document.querySelector("#password");
    const r_password = document.querySelector("#r_password");

    fname.addEventListener("input",function(){
        const firstnameVal= fname.value.trim();
        const hasNumbers = /\d/.test(firstnameVal);
        const hasSpecialChars= /[^a-zA-Z\s-]/.test(firstnameVal);

        if(!firstnameVal){
            fname.setCustomValidity("First name is required");
        }else if (firstnameVal.length>30){
            fname.setCustomValidity("Only 30 characters allowed");
        }else if(hasNumbers){
            fname.setCustomValidity("No numbers allowed unless you are Elon Musk's child");
        }else if(hasSpecialChars){
            fname.setCustomValidity('No special characters allowed');
        }else{
            fname.setCustomValidity('');
        }
    })

    lname.addEventListener("input",function(){
        const lastnameVal= lname.value.trim();
        const hasNumbers = /\d/.test(lastnameVal);  
        const hasSpecialChars= /[^a-zA-Z\s-]/.test(lastnameVal);     

        if(!lastnameVal){
            lname.setCustomValidity("Last name is required");
        }else if (lastnameVal.length>30){
            lname.setCustomValidity("Only 30 characters allowed");
        }else if(hasNumbers){
            lname.setCustomValidity("No numbers allowed unless you are Elon Musk's child");
        }else if(hasSpecialChars){
            lname.setCustomValidity('No special characters allowed');
        }else{
            lname.setCustomValidity('');
        }
    })

    phone.addEventListener("input",function(){
        const phoneVal = phone.value.trim();
        const ValidPhone = /^\d{10}$/.test(phoneVal);

        if(!phoneVal){
            phone.setCustomValidity("Phone number is required");
        }else if(!ValidPhone){
            phone.setCustomValidity("Please enter Valid 10-digit number");
        }else{
            phone.setCustomValidity("");
        }
    })

    email.addEventListener("input", function(){
        const emailVal= email.value.trim();
        const ValidEmail= /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,6}$/.test(emailVal);

        if(!ValidEmail){
            email.setCustomValidity("Invalid email");
        }else{
            email.setCustomValidity('');
        }
    });

    password.addEventListener("input",function(){
        const passwordVal= password.value.trim();
        const ValidPassword= /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/.test(passwordVal);
        if(!ValidPassword){
            password.setCustomValidity("Password must contain one special character and one number");
        }else{
            password.setCustomValidity('');
        }
    });
    
    r_password.addEventListener("input", function () {
        if (r_password.value !== password.value) {
            r_password.setCustomValidity("Passwords do not match!");
        } else {
            r_password.setCustomValidity(""); // Clears error so form can submit
        }
    });


  }

  if (loginform) {
    const email = document.querySelector("#emaillogin");
    const password = document.querySelector("#passwordlogin");

    email.addEventListener("input", function(){
        const emailVal= email.value.trim();
        const ValidEmail= /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,6}$/.test(emailVal);

        if(!ValidEmail){
            email.setCustomValidity("Invalid email");
        }else{
            email.setCustomValidity('');
        }
    });

    password.addEventListener("input",function(){
        const passwordVal= password.value.trim();
        const ValidPassword= /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/.test(passwordVal);
        if(!ValidPassword){
            password.setCustomValidity("Password must contain one special character and one number");
        }else{
            password.setCustomValidity('');
        }
    });
  }
});
