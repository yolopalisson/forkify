// Global app controller
import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, elementStrings, renderLoader, clearLoader } from './views/base';


/** Global state of the app
 * Search object
 * Current recipe object
 * Shopping list object
 * Liked recipes object
 */
const state = {};

const controlSearch = async () => {
    // 1. Get query from view
    const query = searchView.getInput();

    if (query) {
        // 2. Add new search object to the state
        state.search = new Search(query);

        // 3. Prepare UI for results
        searchView.clearInput();
        searchView.clearResult();
        renderLoader(elements.searchRes);

        try {
            // 4. Search for recipes
            await state.search.getResults();
    
            // 5. Render results on the UI
            clearLoader();
            searchView.renderResults(state.search.result);

        } catch (err) {
            alert('Something went wrong :(');
        }
    }

};
elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.pageResults.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');    // in order to target the parent element of the button
   
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResult();
        searchView.renderResults(state.search.result, goToPage);
    }
});

/**
 * Recipe Controller
 */

const controlRecipe = async () => {
    // get the id from the URL
    const id = window.location.hash.replace('#', '');

    if (id) {
        // prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // hightlighted selected item
        if (state.search) searchView.hightlightSelected(id);

        // create new recipe object
        state.recipe = new Recipe(id);

        try {
            // get recipe data
            await state.recipe.getRecipe();
            //console.log(state.recipe.ingredients);
            state.recipe.parseIngredients();
    
            // calcTime and calcServings
            state.recipe.calcTime();
            state.recipe.calcServing();
    
            // render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));

        } catch (err) {
            console.log(err)
            alert('Error with loading the recipe...');
        }
    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * List Controller
 */

 const controlList = () => {
     // create a new list if there are none
     if (!state.list) state.list = new List();

     // add each ingredient to the list and the UI
     state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
     });
 };

 // handle delete and update list item events
 elements.shopping.addEventListener('click',  e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // handle the delete event
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // delete from state
        state.list.deleteItem(id);

        // delete from UI
        listView.deleteItem(id);

        // handle count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
 });

 /**
  * Likes Controller
  */


  const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // user has not yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        // add like to the state
        const newLike = state.likes.addLike(currentID, state.recipe.title, state.recipe.author, state.recipe.img);

        // toggle the like button
        likesView.toggleLikesBtn(true);

        // add like to the UI list
        likesView.renderLike(newLike);


    // user has liked the current recipe
    } else {
        // remove like from the state
        state.likes.deleteLike(currentID);

        // toggle the like button
        likesView.toggleLikesBtn(false);

        // remove like from the UI list
        likesView.deleteLike(currentID);
    }

    likesView.toggleLikesMenu(state.likes.getNumLikes());
  };

// restore liked recipes
window.addEventListener('load', () => {
    state.likes = new Likes();

    // restore likes
    state.likes.readStorage();

    // toggle likes
    likesView.toggleLikesMenu(state.likes.getNumLikes());

    // render existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

// handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // call the likes controller
        controlLike();
    }
});



