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
  -------------------------------------------------------------
  */
  function createVideoCardHTML($xmlItem) {
    // Convert text content of star to number, default to 0 if not found or invalid.
    const stars = parseInt($xmlItem.find('star').text()) || 0;
    const starsHTML = generateStarsHTML(stars);

    return `
      <div class="carousel-card col-12 col-sm-6 col-md-6 col-lg-3 d-flex justify-content-center">
        <div class="card">
          <img src="${$xmlItem
            .find('thumb_url')
            .text()}" class="card-img-top" alt="Video thumbnail">
          <div class="card-img-overlay text-center">
            <img src="images/play.png" alt="Play" width="64px" class="align-self-center play-overlay">
          </div>
          <div class="card-body">
            <h5 class="card-title font-weight-bold">${$xmlItem
              .find('title')
              .text()}</h5>
            <p class="card-text text-muted">${
              $xmlItem.find('sub-title').text() || ''
            }</p>
            <div class="creator d-flex align-items-center">
              <img src="${$xmlItem
                .find('author_pic_url')
                .text()}" alt="${$xmlItem.find('author').text()}" width="30px" class="rounded-circle">
              <h6 class="pl-3 m-0 main-color">${$xmlItem
                .find('author')
                .text()}</h6>
            </div>
            <div class="info pt-3 d-flex justify-content-between">
              <div class="rating">${starsHTML}</div>
              <span class="main-color">${$xmlItem
                .find('duration')
                .text()}</span>
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

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        $.ajax({
          url: url,
          type: 'GET',
          data: params,
          dataType: 'xml', // Explicitly expect XML
        })
          .done((responseXML) => {
            // response is an XMLDocument
            resolve(responseXML); // Resolve the outer promise with the XMLDocument
          })
          .fail((jqXHR, textStatus, errorThrown) => {
            console.error(
              `Failed to fetch XML data from ${url} with params:`,
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
            reject({
              jqXHR,
              textStatus,
              errorThrown,
              message: `Failed to fetch XML data from ${url}`,
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
  function customCarousel(
    itemsCollection,
    trackContainerId,
    prevButtonId,
    nextButtonId
  ) {
    if (!itemsCollection || itemsCollection.length === 0) {
      console.error(
        'No XML items to display in carousel for:',
        trackContainerId
      );
      $(trackContainerId).html(
        '<p class="text-center text-white col-12">No videos available.</p>'
      );
      $(prevButtonId).hide();
      $(nextButtonId).hide();
      return;
    }

    const $carouselTrack = $(trackContainerId);
    const $carouselViewPort = $carouselTrack.parent();
    const $prevButton = $(prevButtonId);
    const $nextButton = $(nextButtonId);
    let currentIndex = 0;

    // Iterate over the jQuery collection of XML elements
    const cardsHTML = itemsCollection
      .map(function () {
        // 'this' refers to each XML DOM element
        return createVideoCardHTML($(this)); // Pass the jQuery-wrapped XML element
      })
      .get()
      .join(''); // .get() converts jQuery map result to array for join

    $carouselTrack.html(cardsHTML);

    function updateCarouselView() {
      const $firstCard = $carouselTrack.find('.carousel-card:first-child');
      if (!$firstCard.length) return;

      const cardWidth = $firstCard.outerWidth(true);
      if (cardWidth === 0) return;

      const visibleCards = Math.floor($carouselViewPort.width() / cardWidth);
      const maxIndex = Math.max(0, itemsCollection.length - visibleCards);

      currentIndex = Math.min(Math.max(currentIndex, 0), maxIndex);

      $carouselTrack.css(
        'transform',
        `translateX(-${currentIndex * cardWidth}px)`
      );

      $prevButton.toggle(currentIndex !== 0);
      $nextButton.toggle(
        currentIndex !== maxIndex && itemsCollection.length > visibleCards
      );
    }

    $prevButton.off('click').on('click', () => {
      currentIndex--;
      updateCarouselView();
    });
    $nextButton.off('click').on('click', () => {
      currentIndex++;
      updateCarouselView();
    });

    setTimeout(updateCarouselView, 0);
  }

  /*
  -------------------------------------------------------------
  1. Homepage - quotes & 4. Pricing - quotes
  -------------------------------------------------------------
  */
  function displayQuotes(xmlDoc) {
    const $quotes = $(xmlDoc).find('quote'); // Find all <quote> elements

    if ($quotes.length === 0) {
      console.error('No quotes data to display from XML.');
      $('#carousel-items').html(
        '<p class="text-center text-white">No quotes available at the moment.</p>'
      );
      return;
    }

    const quotesHTML = $quotes
      .map(function (index) {
        // 'this' is the current <quote> XML element
        const $currentQuote = $(this);
        const activeClass = index === 0 ? ' active' : '';
        return `
        <blockquote class="carousel-item${activeClass}">
          <div class="row mx-auto align-items-center">
            <div class="col-12 col-sm-2 col-lg-2 offset-lg-1 text-center">
              <img src="${$currentQuote
                .find('pic_url')
                .text()}" class="d-block align-self-center" alt="Picture of ${$currentQuote.find('name').text()}">
            </div>
            <div class="col-12 col-sm-7 offset-sm-2 col-lg-9 offset-lg-0">
              <div class="quote-text">
                <p class="text-white pr-md-4 pr-lg-5">${$currentQuote
                  .find('text')
                  .text()}</p>
                <h4 class="text-white font-weight-bold">${$currentQuote
                  .find('name')
                  .text()}</h4>
                <span class="text-white">${$currentQuote
                  .find('title')
                  .text()}</span>
              </div>
            </div>
          </div>
        </blockquote>
      `;
      })
      .get()
      .join('');

    $('#carousel-items').html(quotesHTML);
  }

  // XML API URL for quotes
  const quotesURL = 'https://smileschool-api.hbtn.info/xml/quotes';
  fetchData(quotesURL)
    .then(displayQuotes) // displayQuotes now takes an XMLDocument
    .catch((error) =>
      console.error('Error fetching quotes XML:', error.message || error)
    );

  /*
  -------------------------------------------------------------
  2. Homepage - popular tutorials
  -------------------------------------------------------------
  */
  // XML API URL for popular tutorials
  const popularTutorialsURL =
    'https://smileschool-api.hbtn.info/xml/popular-tutorials';
  fetchData(popularTutorialsURL)
    .then((xmlDoc) => {
      popularData = $(xmlDoc).find('video'); // Store jQuery collection of <video> elements
      customCarousel(
        popularData,
        '#popular-carousel-track',
        '#popular-prev-button',
        '#popular-next-button'
      );
    })
    .catch((error) => {
      console.error(
        'Error fetching popular tutorials XML:',
        error.message || error
      );
      $('#popular-carousel-track').html(
        '<p class="text-center text-white col-12">Could not load popular tutorials.</p>'
      );
    });

  /*
  -------------------------------------------------------------
  3. Homepage - latest videos
  -------------------------------------------------------------
  */
  // XML API URL for latest videos
  const latestVideosURL = 'https://smileschool-api.hbtn.info/xml/latest-videos';
  fetchData(latestVideosURL)
    .then((xmlDoc) => {
      latestData = $(xmlDoc).find('video'); // Store jQuery collection of <video> elements
      customCarousel(
        latestData,
        '#latest-carousel-track',
        '#latest-prev-button',
        '#latest-next-button'
      );
    })
    .catch((error) => {
      console.error(
        'Error fetching latest videos XML:',
        error.message || error
      );
      $('#latest-carousel-track').html(
        '<p class="text-center text-white col-12">Could not load latest videos.</p>'
      );
    });

  /*
  -------------------------------------------------------------
  5. Courses
  -------------------------------------------------------------
  */
  function displayCourses(xmlDoc) {
    const $courses = $(xmlDoc).find('courses course'); // Find all <course> elements within <courses>

    if (!$courses || $courses.length === 0) {
      console.error('No courses data in XML or invalid XML structure.');
      // Check if a specific count element exists in XML, otherwise use length
      let videoCountText = '0 videos';
      const $totalVideosElement = $(xmlDoc).find('total_videos'); // Example: if API provides a total count
      if ($totalVideosElement.length > 0) {
        videoCountText = `${$totalVideosElement.text()} videos`;
      }
      $('.video-count').text(videoCountText);

      $('#courses-container').html(
        '<p class="text-center text-white py-5">No courses available or could not load courses.</p>'
      );
      return;
    }

    $('.video-count').text(`${$courses.length} videos`);

    const cardsHTML = $courses
      .map(function () {
        // 'this' is the current <course> XML element
        return createVideoCardHTML($(this)); // Pass jQuery-wrapped <course> element
      })
      .get()
      .join('');

    $('#courses-container').html(cardsHTML);
  }

  function updateCourses() {
    const qVal = $('.search-text-area').val() || '';
    const topicVal = $('.box2 .dropdown-toggle span').text().trim();
    const sortVal = $('.box3 .dropdown-toggle span').text().trim();

    // XML API URL for courses
    const coursesApiUrl = 'https://smileschool-api.hbtn.info/xml/courses';
    fetchData(
      coursesApiUrl,
      { q: qVal, topic: topicVal, sort: sortVal },
      '#courses-container'
    )
      .then(displayCourses) // displayCourses now takes an XMLDocument
      .catch((error) => {
        console.error('Error updating courses XML:', error.message || error);
      });
  }

  function populateDropdowns() {
    // XML API URL for courses (to get topics and sorts)
    const coursesApiUrl = 'https://smileschool-api.hbtn.info/xml/courses';
    fetchData(coursesApiUrl, {})
      .then((xmlDoc) => {
        const $topics = $(xmlDoc).find('topics topic');
        const $sorts = $(xmlDoc).find('sorts sort');

        if ($topics.length === 0 && $sorts.length === 0) {
          console.error('No topics or sorts data in XML for dropdowns.');
          return;
        }

        const formatText = (text) =>
          text
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());

        const $topicDropdownMenu = $('.box2 .dropdown-menu');
        const topicsArray = $topics
          .map(function () {
            return $(this).text();
          })
          .get();
        $topicDropdownMenu.html(
          topicsArray
            .map(
              (t) => `<a class="dropdown-item" href="#">${formatText(t)}</a>`
            )
            .join('')
        );
        if (topicsArray.length > 0) {
          $('.box2 .dropdown-toggle span').text(formatText(topicsArray[0]));
        }

        const $sortDropdownMenu = $('.box3 .dropdown-menu');
        const sortsArray = $sorts
          .map(function () {
            return $(this).text();
          })
          .get();
        $sortDropdownMenu.html(
          sortsArray
            .map(
              (s) => `<a class="dropdown-item" href="#">${formatText(s)}</a>`
            )
            .join('')
        );
        if (sortsArray.length > 0) {
          $('.box3 .dropdown-toggle span').text(formatText(sortsArray[0]));
        }

        updateCourses(); // Trigger initial display of courses
      })
      .catch((error) =>
        console.error(
          'Error populating dropdowns from XML:',
          error.message || error
        )
      );
  }

  // Event bindings for courses section (remain unchanged)
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

  if ($('.search-text-area').length) {
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
      // popularData and latestData are already jQuery collections of XML elements
      if (popularData && $('#popular-carousel-track').length) {
        customCarousel(
          popularData, // Pass the stored jQuery collection
          '#popular-carousel-track',
          '#popular-prev-button',
          '#popular-next-button'
        );
      }
      if (latestData && $('#latest-carousel-track').length) {
        customCarousel(
          latestData, // Pass the stored jQuery collection
          '#latest-carousel-track',
          '#latest-prev-button',
          '#latest-next-button'
        );
      }
    }, 250);
  });
});
