"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, ownStory = false) {
  // verify user logged in.
  const loggedInUser = Boolean(currentUser);

  const hostName = story.getHostName();

  return $(`
      <li id="${story.storyId}">
      ${ownStory ? getTrashCanHTML() : ""}
      ${loggedInUser ? getStarHTML(currentUser, story) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <div class="story-author">by ${story.author}</div>
        <div class="story-user">posted by ${story.username}</div>
      </li>
    `);
}

function getStarHTML(user, story) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite === true ? "solid" : "regular";
  return `<i class="fa-${starType} fa-star"></i>`;
}

function getTrashCanHTML() {
  return `<i class="fa-regular fa-trash-can"></i>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

// TODO - New Story
async function updateUIOnNewStory(evt) {
  evt.preventDefault();

  const author = $("#author").val().trim();
  const title = $("#title").val().trim();
  const url = $("#url").val().trim();

  const newStory = await storyList.addStory(currentUser, {
    title,
    author,
    url,
  });

  const story = generateStoryMarkup(newStory);
  $allStoriesList.prepend(story);

  storyList.stories.unshift(newStory);
  currentUser.ownStories.unshift(newStory);

  // Reset Form
  $newStoryForm.slideUp("slow");
  $newStoryForm.trigger("reset");
}

$submitStoryBtn.on("click", updateUIOnNewStory);

// TODO - Favorite Story

function putFavoritesStoriesOnPage() {
  $favStoriesList.empty();
  // If no favorite stories
  if (currentUser.favorites.length === 0) {
    $favStoriesList.append("<p>No Favorite</p>");
  } else {
    for (let story of currentUser.favorites) {
      story = generateStoryMarkup(story);
      $favStoriesList.append(story);
    }
  }
  $favStoriesList.show();
}

function toggleFavorites(evt) {
  const $clickedEl = $(evt.target);
  const storyID = $clickedEl.parent().attr("id");
  const story = storyList.stories.find((story) => story.storyId === storyID);

  if ($clickedEl.hasClass("fa-regular")) {
    // add story to user's favorites
    currentUser.addFavorite(story);
    $clickedEl.toggleClass("fa-regular fa-solid");
  } else {
    // remove favorites
    currentUser.removeFavorite(story);
    $clickedEl.toggleClass("fa-regular fa-solid");
  }
}

$storiesList.on("click", ".fa-star", toggleFavorites);

// TODO - My Stories

function putOwnStoriesOnPage() {
  console.log("after: ", storyList);

  $ownStoriesList.empty();
  if (currentUser.ownStories.length === 0) {
    $ownStoriesList.append("<p>No stories added by user yet!</p>");
  } else {
    for (let story of currentUser.ownStories) {
      story = generateStoryMarkup(story, true);
      $ownStoriesList.append(story);
    }
  }
  $ownStoriesList.show();
}

// TODO - Removing Stories

async function removeStory(evt) {
  const $clickedEl = $(evt.target);
  const storyID = $clickedEl.parent().attr("id");

  console.log("before: ", storyList);

  await storyList.deleteStory(currentUser, storyID);
  putOwnStoriesOnPage();
}

$storiesList.on("click", ".fa-trash-can", removeStory);
