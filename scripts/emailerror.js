const emailInput = document.getElementById("email");
const emailError = document.getElementById("emailError");

emailInput.addEventListener("input", () => {
  const email = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (email === "") {
    emailError.textContent = "";
    emailError.classList.remove("visible");
    emailInput.classList.remove("invalid");
  } else if (!emailRegex.test(email)) {
    emailError.textContent = "Неверный формат email";
    emailError.classList.add("visible");
    emailInput.classList.add("invalid");
  } else {
    emailError.textContent = "";
    emailError.classList.remove("visible");
    emailInput.classList.remove("invalid");
  }
});
