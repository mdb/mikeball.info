document.addEventListener('DOMContentLoaded', () => {
  function populateIGFeeds(data) {
    let footer = document.querySelector('footer ul.ig-feed'),
        gallery = document.querySelector('ul.gallery.ig-feed'),
        images = data.slice(0, 8).map(image => {
          return `<li class="item"><a class="thumbnail" href="${image.permalink}"><img src="${image.media_url}" /></a></li>`;
        });

    footer.innerHTML = images.join('');

    if (gallery) {
      gallery.innerHTML = images.join('');
    }
  }

  fetch('https://clapclapexcitement-gram.herokuapp.com/recent-media')
    .then(response => response.json())
    .then(populateIGFeeds);

  let gallery = document.querySelector('ul.gallery.store-feed');
  if (!gallery) {
    return;
  }

  function populateShopFeeds(data) {
    let footer = document.querySelector('footer ul.store-feed')
        gallery = document.querySelector('ul.gallery.store-feed'),
        items = data.slice(0, 4).map(item => {
          let url = `https://tiendah.bigcartel.com/${item.url}`;

          return `
            <li class="item">
              <a class="thumbnail" href="${url}">
                <img src="${item.images[0].secure_url}" />
              </a>
              <div class="details">
                <aside>$${item.price}</aside>
                <h2><a href="${url}">${item.name}</a></h2>
                <p>${item.description}</p>
                <p><a href="${url}">Buy print</a></p>
              </div>
            </li>`;
        });

      footer.innerHTML = items.join('');

      if (gallery) {
        gallery.innerHTML = items.join('');
      }
  }

  fetch('https://api.bigcartel.com/tiendah/products.json')
    .then(response => response.json())
    .then(populateShopFeeds);

  let button = document.getElementsByTagName('button')[0],
      header = button.parentElement;

  button.addEventListener('click', () => {
    if (header.className === '') {
      header.className = 'toggled';

      return;
    }

    header.className = '';
  });
});
