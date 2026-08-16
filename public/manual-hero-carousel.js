(() => {
  const carousels = document.querySelectorAll("[data-world-carousel]");

  carousels.forEach((carousel) => {
    if (!(carousel instanceof HTMLElement)) return;

    const stage = carousel.querySelector(".manual-figure__stage");
    const previous = carousel.querySelector("[data-carousel-previous]");
    const next = carousel.querySelector("[data-carousel-next]");
    const dots = Array.from(carousel.querySelectorAll("[data-carousel-dot]"));

    if (!(stage instanceof HTMLElement)) return;
    if (!(previous instanceof HTMLButtonElement)) return;
    if (!(next instanceof HTMLButtonElement)) return;

    carousel.dataset.carouselEnhanced = "true";
    stage.setAttribute(
      "aria-label",
      "Hero artwork carousel. Swipe or drag horizontally, or use the previous and next controls."
    );

    let gesture = null;

    const clearGesture = () => {
      const pointerId = gesture?.pointerId;
      gesture = null;
      carousel.classList.remove("is-dragging");

      if (pointerId !== undefined && stage.hasPointerCapture?.(pointerId)) {
        stage.releasePointerCapture(pointerId);
      }
    };

    stage.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      gesture = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        startX: event.clientX,
        startY: event.clientY,
        startedAt: performance.now()
      };

      carousel.classList.add("is-dragging");
      stage.setPointerCapture?.(event.pointerId);
    });

    stage.addEventListener("pointerup", (event) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;

      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      const elapsed = performance.now() - gesture.startedAt;
      const width = stage.getBoundingClientRect().width;
      const distanceThreshold = Math.max(48, Math.min(96, width * 0.1));
      const horizontalIntent = Math.abs(deltaX) > Math.abs(deltaY) * 1.15;
      const deliberateSwipe = Math.abs(deltaX) >= distanceThreshold;
      const quickFlick = elapsed < 320 && Math.abs(deltaX) >= 36;

      if (horizontalIntent && (deliberateSwipe || quickFlick)) {
        event.preventDefault();
        if (deltaX < 0) next.click();
        else previous.click();
      }

      clearGesture();
    });

    stage.addEventListener("pointercancel", clearGesture);
    stage.addEventListener("lostpointercapture", (event) => {
      if (gesture && event.pointerId === gesture.pointerId) clearGesture();
    });
    stage.addEventListener("dragstart", (event) => event.preventDefault());

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "Home") {
        event.preventDefault();
        const first = dots[0];
        if (first instanceof HTMLButtonElement) first.click();
      }

      if (event.key === "End") {
        event.preventDefault();
        const last = dots.at(-1);
        if (last instanceof HTMLButtonElement) last.click();
      }
    });
  });
})();