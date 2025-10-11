const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("password");
const passwordError = document.getElementById("passwordError");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailInput.value.trim(),
      password: passwordInput.value,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    console.log("Успешный вход:", data);
    // Тут можешь перейти на другую страницу
  } else {
    const err = await res.json();
    if (err.error === "invalid_credentials") {
      passwordError.textContent = "Неправильный пароль";
      passwordError.classList.add("visible");
      passwordInput.classList.add("invalid");
    } else {
      passwordError.textContent = "Ошибка входа";
      passwordError.classList.add("visible");
    }
  }
});
