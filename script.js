/* =========================================================
   Hola Vacaciones – zachowanie strony (projekt edukacyjny)

   Sygnały do lokalnej warstwy danych (dataLayer):
     cta_click    – przy każdym rzeczywistym kliknięciu CTA, parametr cta_location
     form_start   – pierwsza zmiana wartości pola, najwyżej raz na wyświetlenie strony
     lead_success – poprawny demonstracyjny sukces, najwyżej raz na wyświetlenie strony
     form_error   – (ROZSZERZENIE, opcjonalne) pole, które nie przeszło walidacji

   Sama tablica dataLayer niczego nie wysyła do Google ani Meta.
   Na spotkaniu 3 odczyta ją Google Tag Manager.
   Do dataLayer NIGDY nie trafiają wartości wpisane w formularz.
   ========================================================= */

(function () {
  'use strict';

  // Nie nadpisujemy istniejącej tablicy (np. utworzonej przez GTM lub CMP).
  window.dataLayer = window.dataLayer || [];

  function pushSignal(data) {
    window.dataLayer.push(data);
  }

  var FORM_ID = 'lead-form';

  /* ---------- 1. Kliknięcia CTA ---------- */
  // Każdy przycisk CTA ma atrybut data-cta-location (hero, oferta, obiekcja).
  var ctas = document.querySelectorAll('[data-cta-location]');
  ctas.forEach(function (cta) {
    cta.addEventListener('click', function () {
      pushSignal({
        event: 'cta_click',
        cta_location: cta.getAttribute('data-cta-location')
      });
      // Domyślne działanie linku (#formularz) zostaje – przewinięcie do formularza.
    });
  });

  /* ---------- 2. Formularz ---------- */
  var form = document.getElementById(FORM_ID);
  if (!form) {
    return;
  }

  var emailInput = document.getElementById('email');
  var groupSelect = document.getElementById('grupa');
  var submitButton = document.getElementById('lead-submit');
  var statusBox = document.getElementById('form-status');

  var formStarted = false; // czy form_start już wysłano w tym wyświetleniu strony
  var leadSent = false;    // czy lead_success już wysłano w tym wyświetleniu strony

  /* 2a. form_start – pierwsza zmiana wartości dowolnego pola */
  function handleFirstChange() {
    if (formStarted) {
      return;
    }
    formStarted = true;
    pushSignal({
      event: 'form_start',
      form_id: FORM_ID
    });
  }
  form.addEventListener('input', handleFirstChange);
  form.addEventListener('change', handleFirstChange);

  /* 2b. Walidacja */
  // Prosty wzorzec: coś@coś.domena, bez spacji.
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function showError(field, errorId, message) {
    var errorEl = document.getElementById(errorId);
    errorEl.textContent = message;
    errorEl.hidden = false;
    field.setAttribute('aria-invalid', 'true');
  }

  function clearError(field, errorId) {
    var errorEl = document.getElementById(errorId);
    errorEl.textContent = '';
    errorEl.hidden = true;
    field.removeAttribute('aria-invalid');
  }

  // Zwraca listę błędów: [{ field, fieldId, errorType }]
  function validate() {
    var errors = [];
    var email = emailInput.value.trim();

    if (email === '') {
      showError(emailInput, 'email-error', 'Wpisz adres e-mail.');
      errors.push({ field: emailInput, fieldId: 'email', errorType: 'empty' });
    } else if (!EMAIL_PATTERN.test(email)) {
      showError(emailInput, 'email-error', 'Wpisz adres e-mail w formacie nazwa@domena.pl.');
      errors.push({ field: emailInput, fieldId: 'email', errorType: 'format' });
    } else {
      clearError(emailInput, 'email-error');
    }

    if (groupSelect.value === '') {
      showError(groupSelect, 'grupa-error', 'Wybierz grupę, do której chcesz dołączyć.');
      errors.push({ field: groupSelect, fieldId: 'grupa', errorType: 'empty' });
    } else {
      clearError(groupSelect, 'grupa-error');
    }

    return errors;
  }

  // Gdy użytkownik poprawia pole, chowamy jego komunikat błędu.
  emailInput.addEventListener('input', function () {
    if (emailInput.getAttribute('aria-invalid') === 'true') {
      clearError(emailInput, 'email-error');
    }
  });
  groupSelect.addEventListener('change', function () {
    if (groupSelect.value !== '') {
      clearError(groupSelect, 'grupa-error');
    }
  });

  /* 2c. Wysłanie (symulacja) */
  form.addEventListener('submit', function (event) {
    // Brak żądania do serwera i brak dopisywania danych do adresu URL.
    event.preventDefault();

    // Po sukcesie kolejne próby niczego nie robią (blokada podwójnego sukcesu).
    if (leadSent) {
      return;
    }

    var errors = validate();

    if (errors.length > 0) {
      // ROZSZERZENIE (opcjonalne): informacja, które pole nie przeszło walidacji.
      // Wysyłamy tylko nazwę pola i typ błędu, nigdy wpisaną wartość.
      errors.forEach(function (err) {
        pushSignal({
          event: 'form_error',
          form_id: FORM_ID,
          field_id: err.fieldId,
          error_type: err.errorType
        });
      });
      // Fokus na pierwszym błędnym polu – ułatwia obsługę klawiaturą i czytnikiem ekranu.
      errors[0].field.focus();
      return;
    }

    // === Tutaj walidacja zakończyła się powodzeniem: demonstracyjny sukces ===
    leadSent = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Zgłoszenie zakończone';

    statusBox.textContent = 'Demonstracja zakończona — dane nie zostały wysłane';

    // Sygnał sukcesu – dokładnie raz na wyświetlenie strony, bez wartości pól.
    pushSignal({
      event: 'lead_success',
      form_id: FORM_ID
    });
  });

  /* ---------- 3. Ustawienia prywatności ---------- */
  // Na spotkaniu 3 przycisk otworzy baner Cookiebot (Cookiebot.renew()).
  var privacyButton = document.getElementById('privacy-settings');
  var privacyNote = document.getElementById('privacy-note');
  if (privacyButton) {
    privacyButton.addEventListener('click', function () {
      if (window.Cookiebot && typeof window.Cookiebot.renew === 'function') {
        window.Cookiebot.renew();
      } else if (privacyNote) {
        privacyNote.textContent = 'Narzędzie do zarządzania zgodami nie jest jeszcze podłączone.';
        privacyNote.hidden = false;
      }
    });
  }
})();
