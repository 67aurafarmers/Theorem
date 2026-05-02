const menuButton = document.getElementById("menuButton");
const mobileMenu = document.getElementById("mobileMenu");
const nextHero = document.getElementById("nextHero");
const currentSlide = document.getElementById("currentSlide");
const orangeBlock = document.querySelector(".orange-block");
const figureCard = document.querySelector(".figure-card");
const projectCards = document.querySelectorAll(".project-card");
const signupForm = document.getElementById("signupForm");
const emailInput = document.getElementById("emailInput");
const formMessage = document.getElementById("formMessage");

const slides = [
  {
    index: "01",
    accent: "#ff4b2b",
    shift: "translateX(0)",
    figure: "translateY(0) rotate(0deg)"
  },
  {
    index: "02",
    accent: "#111111",
    shift: "translateX(-46px)",
    figure: "translateY(-14px) rotate(-3deg)"
  },
  {
    index: "03",
    accent: "#ff6a3d",
    shift: "translateX(34px)",
    figure: "translateY(10px) rotate(4deg)"
  }
];

let activeSlide = 0;

menuButton.addEventListener("click", () => {
  menuButton.classList.toggle("active");
  mobileMenu.classList.toggle("open");
});

mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.classList.remove("active");
    mobileMenu.classList.remove("open");
  });
});

nextHero.addEventListener("click", () => {
  activeSlide = (activeSlide + 1) % slides.length;
  const slide = slides[activeSlide];

  currentSlide.textContent = slide.index;
  orangeBlock.style.background = slide.accent;
  orangeBlock.style.transform = slide.shift;
  figureCard.style.transform = slide.figure;
});

projectCards.forEach((card) => {
  card.addEventListener("click", () => {
    projectCards.forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
  });
});

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();

  if (!email || !email.includes("@")) {
    formMessage.textContent = "Enter a valid email to request access.";
    return;
  }

  formMessage.textContent = "Access requested. Field signal received.";
  emailInput.value = "";
});

const revealElements = document.querySelectorAll(
  ".project-card, .systems, .shop-card, .drop-card"
);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.animate(
          [
            { opacity: 0, transform: "translateY(24px)" },
            { opacity: 1, transform: "translateY(0)" }
          ],
          {
            duration: 600,
            easing: "cubic-bezier(.2,.8,.2,1)",
            fill: "forwards"
          }
        );

        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealElements.forEach((element) => {
  element.style.opacity = "0";
  observer.observe(element);
});
