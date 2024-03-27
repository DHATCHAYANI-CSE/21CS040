const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Function to fetch products from the test server API
async function fetchProducts(
  companyName,
  category,
  n,
  minPrice,
  maxPrice,
  DkAKTP
) {
  try {
    const response = await axios.get(
      `http://20.244.56.144/test/companies/${companyName}/categories/${category}/products`,
      {
        params: {
          top: n,
          minPrice,
          maxPrice,
        },
        headers: {
          Authorization: `Bearer ${DkAKTP}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response.data);
  }
}

// Function to register a company
async function registerCompany(companyDetails) {
  try {
    const response = await axios.post(
      "http://20.244.56.144/test/register",
      companyDetails
    );
    return response.data;
  } catch (error) {
    throw new Error(error.response.data);
  }
}

// Function to obtain an authorization token
async function getAccessToken(companyDetails) {
  try {
    const response = await axios.post(
      "http://20.244.56.144/test/auth",
      companyDetails
    );
    return response.data.access_token;
  } catch (error) {
    throw new Error(error.response.data);
  }
}

// Registration endpoint
app.post("/register", async (req, res) => {
  try {
    const { companyName, ownerName, rollNo, ownerEmail, accesscode } = req.body;
    const companyDetails = {
      companyName,
      ownerName,
      rollNo,
      ownerEmail,
      accesscode,
    };

    const registrationResponse = await registerCompany(companyDetails);
    res.status(200).json(registrationResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Authentication endpoint
app.post("/auth", async (req, res) => {
  try {
    const { companyName, clientId, ownerName, ownerEmail, rollNo } = req.body;
    const companyDetails = {
      companyName,
      clientId,
      ownerName,
      ownerEmail,
      rollNo,
    };

    const accessToken = await getAccessToken(companyDetails);
    res.status(200).json({ access_token: accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /categories/:categoryname/products
app.get("/categories/:categoryname/products", async (req, res) => {
  try {
    const { companyName, DkAKTP } = req.query;
    const { categoryname } = req.params;
    const { top = 10, minPrice, maxPrice, sort } = req.query;

    // Fetch products
    let products = await fetchProducts(
      companyName,
      categoryname,
      top,
      minPrice,
      maxPrice,
      DkAKTP
    );

    // Sorting logic
    if (sort === "rating_asc") {
      products.sort((a, b) => a.rating - b.rating);
    } else if (sort === "rating_desc") {
      products.sort((a, b) => b.rating - a.rating);
    } else if (sort === "price_asc") {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      products.sort((a, b) => b.price - a.price);
    }

    // Pagination
    const page = req.query.page || 1;
    const startIndex = (page - 1) * top;
    const endIndex = page * top;
    const paginatedProducts = products.slice(startIndex, endIndex);

    res.json(paginatedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /categories/:categoryname/products/:productid
app.get("/categories/:categoryname/products/:productid", async (req, res) => {
  try {
    const { companyName, DkAKTP } = req.query;
    const { categoryname, productid } = req.params;

    // Fetch product details
    const products = await fetchProducts(
      companyName,
      categoryname,
      1,
      undefined,
      undefined,
      DkAKTP
    );
    const product = products.find((product) => product.id === productid);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
