// consultation.js — Patient Consultation Form Submission
// Sends form data to the Express backend → Firestore via Admin SDK

document.addEventListener('DOMContentLoaded', () => {
  const form       = document.getElementById('consultationForm');
  const submitBtn  = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');
  const loader     = document.getElementById('submitLoader');
  const msgBox     = document.getElementById('formMsg');
  const diseaseSelect = document.getElementById('disease');

  // Pre-select disease from URL query parameter (e.g. consultation.html?disease=Kidney+Stones)
  const urlParams = new URLSearchParams(window.location.search);
  const diseaseParam = urlParams.get('disease');

  if (diseaseParam && diseaseSelect) {
    const cleanParam = decodeURIComponent(diseaseParam).trim().toLowerCase();
    let matched = false;

    for (let i = 0; i < diseaseSelect.options.length; i++) {
      const opt = diseaseSelect.options[i];
      const optVal = opt.value.trim().toLowerCase();
      const optText = opt.text.trim().toLowerCase();

      if (
        (optVal && optVal === cleanParam) ||
        (optText && optText === cleanParam) ||
        (optVal && optVal.includes(cleanParam)) ||
        (cleanParam && optVal && cleanParam.includes(optVal)) ||
        (optText && optText.includes(cleanParam)) ||
        (cleanParam && optText && cleanParam.includes(optText))
      ) {
        diseaseSelect.selectedIndex = i;
        matched = true;
        break;
      }
    }

    if (matched) {
      diseaseSelect.style.borderColor = 'var(--green-mid)';
      diseaseSelect.style.boxShadow = '0 0 0 3px rgba(46, 134, 193, 0.25)';
      // Smooth scroll to form if opened via disease link
      setTimeout(() => {
        diseaseSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
        diseaseSelect.focus();
      }, 150);
    }
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMsg();

    const name            = document.getElementById('name').value.trim();
    const age             = document.getElementById('age').value.trim();
    const gender          = document.getElementById('gender').value;
    const mobile          = document.getElementById('mobile').value.trim();
    const email           = document.getElementById('email').value.trim();
    const disease         = document.getElementById('disease').value;
    const medicalHistory  = document.getElementById('medicalHistory').value.trim();
    const currentMedicines= document.getElementById('currentMedicines').value.trim();

    // Basic validation
    if (!name) return showMsg('error', '⚠️ Please enter your full name.');
    if (!age || isNaN(age) || age < 1 || age > 120)
      return showMsg('error', '⚠️ Please enter a valid age.');
    if (!gender)  return showMsg('error', '⚠️ Please select your gender.');
    if (!mobile || mobile.replace(/\D/g,'').length < 10)
      return showMsg('error', '⚠️ Please enter a valid 10-digit mobile number.');
    if (!disease) return showMsg('error', '⚠️ Please select your main health concern.');

    setLoading(true);

    try {
      const response = await fetch('/api/consultation', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, age, gender, mobile, email,
          disease, medicalHistory, currentMedicines
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMsg('success',
          '✅ Your consultation has been submitted successfully! ' +
          'Dr. Verma will review your case and contact you within 24 hours.'
        );
        form.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showMsg('error', '❌ ' + (data.error || 'Something went wrong. Please try again.'));
      }
    } catch (err) {
      console.error('Submission error:', err);
      showMsg('error', '❌ Could not connect to the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  });

  function setLoading(state) {
    submitBtn.disabled  = state;
    submitText.style.display = state ? 'none' : 'inline';
    loader.style.display     = state ? 'inline-block' : 'none';
  }

  function showMsg(type, text) {
    msgBox.className = `form-msg ${type} show`;
    msgBox.textContent = text;
    msgBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearMsg() {
    msgBox.className = 'form-msg';
    msgBox.textContent = '';
  }
});

