window.pageTranslations = {
    es: {
        'bio.p1': 'Diego De Aduriz nació en la ciudad de Buenos Aires en 1977. Estudió Bellas Artes y Arquitectura. Trabaja en soportes múltiples: dibujo, pintura, collage, instalaciones, performance, diseño de indumentaria, edición de fanzines, escritura y redes sociales. En 2022 festejó sus 20 años en el arte con una gran retrospectiva en el Museo de Arte Contemporáneo de Buenos Aires (MACBA).',
        'bio.p2': 'Publicó dos libros: el poemario “Hoy recordé algo que había olvidado” (Iván Rosado, 2017) y el diario “Un beso en la casa de los sueños” (Triana, 2021). Participó del Salón Nacional de Artes Visuales, el Premio de Pintura del Banco Central, el Premio Klemm y residencias como la Beca Kuitca y el Laboratorio de Acción, en el C. C. San Martín.',
        'bio.p3': 'Realizó muestras, performances y desfiles en galerías, museos y ferias de la Argentina, incluyendo el Museo de Arte Moderno de Buenos Aires (MAMBA); Museo de Arte Latinoamericano de Buenos Aires (MALBA); Palais de Glace; Arteba; BafWeek y museos de arte contemporáneo de Mendoza y de Salta.',
        'bio.p4': 'También en el exterior: en Londres (Frieze Art Fair); Nueva York (Consulado Argentino; Hogar Collection Gallery); Madrid (Semana Internacional de la Moda) y Brasilia (C. C. Renato Russo).',
        'bio.contact_me': 'Contactame'
    },
    en: {
        'bio.p1': 'Diego De Aduriz was born in the city of Buenos Aires in 1977. He studied Fine Arts and Architecture. He works across multiple mediums: drawing, painting, collage, installations, performance, fashion design, fanzine editing, writing, and social media. In 2022, he celebrated 20 years in art with a major retrospective at the Buenos Aires Museum of Contemporary Art (MACBA).',
        'bio.p2': 'He published two books: the poetry collection “Hoy recordé algo que había olvidado” (Iván Rosado, 2017) and the diary “Un beso en la casa de los sueños” (Triana, 2021). He participated in the National Salon of Visual Arts, the Central Bank Painting Prize, the Klemm Prize, and residencies such as the Kuitca Scholarship and the Action Laboratory at the San Martín Cultural Center.',
        'bio.p3': 'He held exhibitions, performances, and fashion shows in galleries, museums, and fairs in Argentina, including the Buenos Aires Museum of Modern Art (MAMBA); Buenos Aires Museum of Latin American Art (MALBA); Palais de Glace; Arteba; BafWeek, and contemporary art museums of Mendoza and Salta.',
        'bio.p4': 'Also abroad: in London (Frieze Art Fair); New York (Argentine Consulate; Hogar Collection Gallery); Madrid (International Fashion Week) and Brasilia (Renato Russo Cultural Center).',
        'bio.contact_me': 'Contact Me'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('bioCarouselTrack');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');

    if (track && prevBtn && nextBtn) {
        let images = track.querySelectorAll('img');

        // Clone first 2 images to create a seamless infinite loop
        for (let i = 0; i < 2; i++) {
            if (images[i]) {
                const clone = images[i].cloneNode(true);
                track.appendChild(clone);
            }
        }

        images = track.querySelectorAll('img');
        const numOriginals = images.length - 2;
        let currentIndex = 0;
        let isTransitioning = false;

        const updateCarousel = (animate = true) => {
            track.style.transition = animate ? 'transform 0.5s ease-in-out' : 'none';
            // Translate by 50% per image, or 100% on mobile
            const offsetMultiplier = window.innerWidth <= 768 ? 100 : 50;
            const offset = -currentIndex * offsetMultiplier;
            track.style.transform = `translateX(${offset}%)`;
        };

        window.addEventListener('resize', () => updateCarousel(false));

        const slideNext = () => {
            if (isTransitioning) return;
            isTransitioning = true;
            currentIndex++;
            updateCarousel();

            // If we reached the cloned images, snap back instantly after animation
            if (currentIndex === numOriginals) {
                setTimeout(() => {
                    currentIndex = 0;
                    updateCarousel(false);
                    isTransitioning = false;
                }, 500);
            } else {
                setTimeout(() => { isTransitioning = false; }, 500);
            }
        };

        const slidePrev = () => {
            if (isTransitioning) return;
            isTransitioning = true;

            if (currentIndex === 0) {
                // Snap to clone silently, then animate back one
                currentIndex = numOriginals;
                updateCarousel(false);

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        currentIndex--;
                        updateCarousel(true);
                        setTimeout(() => { isTransitioning = false; }, 500);
                    });
                });
            } else {
                currentIndex--;
                updateCarousel();
                setTimeout(() => { isTransitioning = false; }, 500);
            }
        };

        nextBtn.addEventListener('click', () => {
            slideNext();
            resetInterval();
        });

        prevBtn.addEventListener('click', () => {
            slidePrev();
            resetInterval();
        });

        let autoPlayInterval = setInterval(slideNext, 2500);

        const resetInterval = () => {
            clearInterval(autoPlayInterval);
            autoPlayInterval = setInterval(slideNext, 2500);
        };

        track.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
        track.addEventListener('mouseleave', resetInterval);
    }

    // Scroll Arrow Logic
    const bioText = document.getElementById('bioText');
    const scrollArrow = document.getElementById('scrollArrow');

    if (bioText && scrollArrow) {
        const checkScroll = () => {
            // Check if scrollable at all
            if (bioText.scrollHeight > bioText.clientHeight + 10) {
                scrollArrow.style.display = 'flex';
                // If scrolled to bottom, hide it
                if (bioText.scrollTop + bioText.clientHeight >= bioText.scrollHeight - 20) {
                    scrollArrow.style.opacity = '0';
                } else {
                    scrollArrow.style.opacity = '1';
                }
            } else {
                scrollArrow.style.display = 'none';
            }
        };

        bioText.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);

        scrollArrow.addEventListener('click', () => {
            bioText.scrollBy({ top: 200, behavior: 'smooth' });
        });

        // Wait a small moment for layout calculation
        setTimeout(checkScroll, 100);
    }
});
