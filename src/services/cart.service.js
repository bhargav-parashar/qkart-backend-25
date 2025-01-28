const httpStatus = require("http-status");
const { Cart, Product } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");

// TODO: CRIO_TASK_MODULE_CART - Implement the Cart service methods

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
   //GET CART BY USER EMAIL
   let cart = await Cart.findOne({email: user.email});
  
   //IF CART IS NULL, THROW ERROR
    if(cart == null){
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "User does not have a cart"
      )
    }

    return cart;
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {
  //GET CART BY USER EMAIL
  let cart = await Cart.findOne({email: user.email});
  
  //IF THERE IS NO CART, CREATE AN EMPTY CART FOR USER
  if(!cart){
    try{
      cart = await Cart.create({
        email : user.email,
        cartItems : [],
        paymentOption : config.default_payment_option
      })
    }catch(err){
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "User cart creation failed because user already have a cart"
      )
    }
  }
  
  //OPTIONAL - IF CART IS NULL, THROW ERROR
  if(cart == null){
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "User does not have a cart"
    )
  }

  //CHECK IF PRODUCT IS ALREADY THERE IS CART
  let productIndex = -1;
  for( let i = 0; i < cart.cartItems.length; i++){
    if(productId == cart.cartItems[i].product._id){
      productIndex = i;
    }
  }
  
  //IF PRODUCT IS NOT PRESENT IN CART, 
  //GET PRODUCT BY PRODUCT ID FROM PRODUCT COLLECTION AND PUSH TO CART
  //ELSE THROW ERROR - PRODUCT ALREADY IN CART
  if(productIndex == -1){
    let product = await Product.findOne({_id : productId});

    //IF PRODUCT IS NOT PRESENT IN PRODUCT COLLECTION, THROW ERROR
    if(product == null){
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Product doesn't exist in database"
      );
    }

    //IF PRODUCT FOUND IN PRODUCT COLLECTION, ADD TO CART
    cart.cartItems.push({product: product, quantity: quantity})
  }else{
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product already in cart. use the cart sidebar to update or remove product from cart"
    )
  }
  
  //UPDATE THE CURRENT STATE OF CART IN DATABASE / SYNC
  await cart.save();

  //RETURN CART
  return cart;
};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
   //GET CART BY USER EMAIL
   let cart = await Cart.findOne({email: user.email});
  
   //IF THERE IS NO CART, THROW ERROR
   if(cart == null){
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User does not have a cart. Use POST to create cart and add a product"
    )
   }

   //GET PRODUCT BY PRODUCT ID
   let product = await Product.findOne({_id:productId});

   //IF THERE IS NO PRODUCT, THROW ERROR
   if(product == null){
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    )
   }
  
  //IF PRODUCT NOT IN CART, THROW ERROR
  //ELSE UPDATE QUANTITY OF PRODUCT IN CART
  let productIndex = -1;
  for( let i = 0; i < cart.cartItems.length; i++){
    if(productId == cart.cartItems[i].product._id){
      productIndex = i;
    }
  }
  if(productIndex == -1){
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product not in cart"
    );
  }else{
   cart.cartItems[productIndex].quantity = quantity;
  }

  //UPDATE CART IN DB
  await cart.save();

  //RETURN CART 
  return cart;
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {

  //GET CART BY USER EMAIL
  let cart = await Cart.findOne({email: user.email});
  
  //IF THERE IS NO CART, THROW ERROR
  if(cart == null){
   throw new ApiError(
     httpStatus.BAD_REQUEST,
     "User does not have a cart"
   )
  }
   
  //IF PRODUCT NOT IN CART, THROW ERROR
  //ELSE UPDATE QUANTITY OF PRODUCT IN CART
  let productIndex = -1;
  for( let i = 0; i < cart.cartItems.length; i++){
    if(productId == cart.cartItems[i].product._id){
      productIndex = i;
    }
  }
  if(productIndex == -1){
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product not in cart"
    );
  }else{
   cart.cartItems.splice(productIndex,1);
  }
  
  //UPDATE CART IN DB
  await cart.save();

  //RETURN CART 
  return cart;
};



// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {

 let cart = await Cart.findOne({email : user.email});

  
  if(cart == null){
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }
  if(cart.cartItems.length === 0){
    throw new ApiError(httpStatus.BAD_REQUEST,"Cart is empty");
  }

  let hasSetNonDefaultAddress = await user.hasSetNonDefaultAddress();
  if(!hasSetNonDefaultAddress){
    
    throw new ApiError(httpStatus.BAD_REQUEST, "Address not set");
  }

  let total = 0;
  for(let i = 0; i < cart.cartItems.length; i++){
    total += cart.cartItems[i].product.cost *  cart.cartItems[i].quantity;
  }
  if(total > user.walletMoney){
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User has insufficient money to process"
    )
  }
  user.walletMoney -= total;
 

  cart.cartItems = [];
  await user.save();
  await cart.save();
};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout
};
