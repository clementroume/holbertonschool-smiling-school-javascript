$(document).ready(function () {
  let popularData = null;
  let latestData = null;

  /*
  -------------------------------------------------------------
  Helper function to generate star rating HTML
  -------------------------------------------------------------
  */
  function generateStarsHTML(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
      stars += `<img src="images/star_${
        i < rating ? 'on' : 'off'
      }.png" alt="star" width="15px">`;
    }
    return stars;
  }

  /*
  -------------------------------------------------------------
  Helper function to generate a single video card HTML
  (Used by carousels and courses display)
  -------------------------------------------------------------
  */
  function createVideoCardHTML(item) {
    const starsHTML = generateStarsHTML(item.star);
    return `
		<div class="carousel-card col-12 col-sm-6 col-md-6 col-lg-3 d-flex justify-content-center">
		  <div class="card">
			<img src="${item.thumb_url}" class="card-img-top" alt="Video thumbnail">
			<div class="card-img-overlay text-center">
			  <img src="images/play.png" alt="Play" width="64px" class="align-self-center play-overlay">
			</div>
			<div class="card-body">
			  <h5 class="card-title font-weight-bold">${item.title}</h5>
			  <p class="card-text text-muted">${item['sub-title'] || ''}</p>
			  <div class="creator d-flex align-items-center">
				<img src="${
          item.author_pic_url
        }" alt="${item.author}" width="30px" class="rounded-circle">
				<h6 class="pl-3 m-0 main-color">${item.author}</h6>
			  </div>
			  <div class="info pt-3 d-flex justify-content-between">
				<div class="rating">${starsHTML}</div>
				<span class="main-color">${item.duration}</span>
			  </div>
			</div>
		  </div>
		</div>
	  `;
  }

  /*
  -------------------------------------------------------------
  Fetch data function (returns a Promise)
  -------------------------------------------------------------
  */
  function fetchData(url, params = {}, containerSelectorForError = null) {
    const $loader = $('.loader');

    if (containerSelectorForError) {
      $(containerSelectorForError).empty(); // Clear previous errors/content
    }

    $loader.show();

    // Wrap the AJAX call in a new Promise that includes the delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        $.ajax({
          url: url,
          type: 'GET',
          data: params,
        })
          .done((response) => {
            resolve(response); // Resolve the outer promise with the response
          })
          .fail((jqXHR, textStatus, errorThrown) => {
            console.error(
              `Failed to fetch data from ${url} with params:`,
              params,
              `Error: ${textStatus}, ${errorThrown}`
            );
            if (containerSelectorForError) {
              $(containerSelectorForError).html(`
              <div class="text-center text-white py-5">
                <p>
                  Something went wrong while loading data.
                  <br>
                  Please try again later.
                </p>
              </div>
            `);
            }
            // Reject with an object to match what .catch() expects
            reject({
              jqXHR,
              textStatus,
              errorThrown,
              message: `Failed to fetch data from ${url}`,
            });
          })
          .always(() => {
            $loader.hide(); // Hide the loader after the AJAX call (which is inside the timeout)
          });
      }, 1000); // 1-second delay to see the spinner
    });
  }

  /*
  -------------------------------------------------------------
  Custom carousel function
  -------------------------------------------------------------
  */
  function customCarousel(data, trackContainerId, prevButtonId, nextButtonId) {
    if (!Array.isArray(data) || data.length === 0) {
      console.error('No data to display in carousel for:', trackContainerId);
      // Optionally, display a message in the carousel track
      $(trackContainerId).html(
        '<p class="text-center text-white col-12">No videos available.</p>'
      );
      $(prevButtonId).hide();
      $(nextButtonId).hide();
      return;
    }

    const $carouselTrack = $(trackContainerId);
    // Assuming the 'carousel-track-container' is the direct parent of the track
    const $carouselViewPort = $carouselTrack.parent();
    const $prevButton = $(prevButtonId);
    const $nextButton = $(nextButtonId);
    let currentIndex = 0;

    const cardsHTML = data.map((el) => createVideoCardHTML(el)).join('');
    $carouselTrack.html(cardsHTML);

    function updateCarouselView() {
      // Ensure cards are rendered and visible before calculating width
      const $firstCard = $carouselTrack.find('.carousel-card:first-child');
      if (!$firstCard.length) return;

      const cardWidth = $firstCard.outerWidth(true);
      if (cardWidth === 0) return; // Avoid issues if not yet in DOM or display:none

      const visibleCards = Math.floor($carouselViewPort.width() / cardWidth);
      const maxIndex = Math.max(0, data.length - visibleCards);

      currentIndex = Math.min(Math.max(currentIndex, 0), maxIndex);

      $carouselTrack.css(
        'transform',
        `translateX(-${currentIndex * cardWidth}px)`
      );

      $prevButton.toggle(currentIndex !== 0);
      $nextButton.toggle(
        currentIndex !== maxIndex && data.length > visibleCards
      );
    }

    $prevButton.off('click').on('click', () => {
      // .off to prevent multiple bindings if re-called
      currentIndex--;
      updateCarouselView();
    });
    $nextButton.off('click').on('click', () => {
      currentIndex++;
      updateCarouselView();
    });

    // Initial setup
    // Use a small timeout to ensure DOM is ready for width calculations, especially after HTML injection
    setTimeout(updateCarouselView, 0);
  }

  /*
  -------------------------------------------------------------
  1. Homepage - quotes & 4. Pricing - quotes
  -------------------------------------------------------------
  */
  function displayQuotes(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('No quotes data to display.');
      $('#carousel-items').html(
        '<p class="text-center text-white">No quotes available at the moment.</p>'
      );
      return;
    }

    const quotesHTML = data
      .map((quote, index) => {
        const activeClass = index === 0 ? ' active' : '';
        return `
		  <blockquote class="carousel-item${activeClass}">
			<div class="row mx-auto align-items-center">
			  <div class="col-12 col-sm-2 col-lg-2 offset-lg-1 text-center">
				<img src="${quote.pic_url}" class="d-block align-self-center" alt="Picture of ${quote.name}">
			  </div>
			  <div class="col-12 col-sm-7 offset-sm-2 col-lg-9 offset-lg-0">
				<div class="quote-text">
				  <p class="text-white pr-md-4 pr-lg-5">${quote.text}</p>
				  <h4 class="text-white font-weight-bold">${quote.name}</h4>
				  <span class="text-white">${quote.title}</span>
				</div>
			  </div>
			</div>
		  </blockquote>
		`;
      })
      .join('');

    $('#carousel-items').html(quotesHTML);
  }

  const quotesURL = 'https://smileschool-api.hbtn.info/quotes';
  fetchData(quotesURL)
    .then(displayQuotes)
    .catch((error) => console.error('Error fetching quotes:', error));

  /*
  -------------------------------------------------------------
  2. Homepage - popular tutorials
  -------------------------------------------------------------
  */
  const popularTutorialsURL =
    'https://smileschool-api.hbtn.info/popular-tutorials';
  fetchData(popularTutorialsURL)
    .then((data) => {
      popularData = data; // Store for resize handler
      customCarousel(
        data,
        '#popular-carousel-track',
        '#popular-prev-button',
        '#popular-next-button'
      );
    })
    .catch((error) => {
      console.error('Error fetching popular tutorials:', error);
      // Optionally display error in specific container for popular tutorials
      $('#popular-carousel-track').html(
        '<p class="text-center text-white col-12">Could not load popular tutorials.</p>'
      );
    });

  /*
  -------------------------------------------------------------
  3. Homepage - latest videos
  -------------------------------------------------------------
  */
  const latestVideosURL = 'https://smileschool-api.hbtn.info/latest-videos';
  fetchData(latestVideosURL)
    .then((data) => {
      latestData = data; // Store for resize handler
      customCarousel(
        data,
        '#latest-carousel-track',
        '#latest-prev-button',
        '#latest-next-button'
      );
    })
    .catch((error) => {
      console.error('Error fetching latest videos:', error);
      $('#latest-carousel-track').html(
        '<p class="text-center text-white col-12">Could not load latest videos.</p>'
      );
    });

  /*
  -------------------------------------------------------------
  5. Courses
  -------------------------------------------------------------
  */
  function displayCourses(data) {
    if (!data || !Array.isArray(data.courses)) {
      console.error('Invalid data received for courses.');
      $('#courses-container').html(
        '<p class="text-center text-white">Could not load courses.</p>'
      );
      $('.video-count').text('0 videos');
      return;
    }
    $('.video-count').text(`${data.courses.length} videos`);
    if (data.courses.length === 0) {
      $('#courses-container').html(
        '<p class="text-center text-white py-5">No courses match your criteria.</p>'
      );
      return;
    }
    const cardsHTML = data.courses
      .map((course) => createVideoCardHTML(course))
      .join('');
    $('#courses-container').html(cardsHTML);
  }

  function updateCourses() {
    const qVal = $('.search-text-area').val() || '';
    // Get actual value, not just displayed text if possible (e.g., from data-value)
    // For now, assuming text is the value as per original code
    const topicVal = $('.box2 .dropdown-toggle span').text().trim();
    const sortVal = $('.box3 .dropdown-toggle span').text().trim();

    fetchData(
      'https://smileschool-api.hbtn.info/courses',
      { q: qVal, topic: topicVal, sort: sortVal },
      '#courses-container' // Pass container for fetchData to handle its error message
    )
      .then(displayCourses)
      .catch((error) => {
        // fetchData already handles displaying an error in #courses-container
        console.error('Error updating courses:', error);
      });
  }

  function populateDropdowns() {
    const coursesApiUrl = 'https://smileschool-api.hbtn.info/courses';
    fetchData(coursesApiUrl, {}) // No specific error container needed here, console log is enough
      .then((data) => {
        if (!data || !data.topics || !data.sorts) {
          console.error('Invalid data received for dropdowns.');
          return;
        }
        const formatText = (text) =>
          text
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());

        const $topicDropdownMenu = $('.box2 .dropdown-menu');
        const topics = data.topics || [];
        $topicDropdownMenu.html(
          topics
            .map(
              (t) => `<a class="dropdown-item" href="#">${formatText(t)}</a>`
            )
            .join('')
        );
        if (topics.length > 0) {
          $('.box2 .dropdown-toggle span').text(formatText(topics[0]));
        }

        const $sortDropdownMenu = $('.box3 .dropdown-menu');
        const sorts = data.sorts || [];
        $sortDropdownMenu.html(
          sorts
            .map(
              (s) => `<a class="dropdown-item" href="#">${formatText(s)}</a>`
            )
            .join('')
        );
        if (sorts.length > 0) {
          $('.box3 .dropdown-toggle span').text(formatText(sorts[0]));
        }

        updateCourses(); // Trigger initial display of courses
      })
      .catch((error) => console.error('Error populating dropdowns:', error));
  }

  // Event bindings for courses section
  $('.search-text-area').on('input', updateCourses);

  $('.box2 .dropdown-menu').on('click', '.dropdown-item', function (e) {
    e.preventDefault();
    $('.box2 .dropdown-toggle span').text($(this).text().trim());
    updateCourses();
  });

  $('.box3 .dropdown-menu').on('click', '.dropdown-item', function (e) {
    e.preventDefault();
    $('.box3 .dropdown-toggle span').text($(this).text().trim());
    updateCourses();
  });

  // Initialize dropdowns and load initial courses
  if ($('.search-text-area').length) {
    // Only if on a page with courses section
    populateDropdowns();
  }

  /*
  -------------------------------------------------------------
  Automatically update carousels on window resize
  -------------------------------------------------------------
  */
  let resizeTimer;
  $(window).on('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (popularData && $('#popular-carousel-track').length) {
        // Check if element exists
        customCarousel(
          popularData,
          '#popular-carousel-track',
          '#popular-prev-button',
          '#popular-next-button'
        );
      }
      if (latestData && $('#latest-carousel-track').length) {
        // Check if element exists
        customCarousel(
          latestData,
          '#latest-carousel-track',
          '#latest-prev-button',
          '#latest-next-button'
        );
      }
    }, 250); // Debounce resize event
  });
});
