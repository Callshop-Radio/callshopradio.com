export const defaultCookieSections = `{
  "sections": [
    {
      "title": "Strictly necessary cookies",
      "description": "This technology is essential to allow you to customize your cookie settings according to your preferences.",
      "linkedCategory": "necessary",
      "cookieTable": {
        "headers": {
          "name": "Name",
          "title": "Service",
          "description": "Description"
        },
        "body": [
          {
            "name": "cc_cookie",
            "title": "Cookie Consent",
            "description": "Cookie set by Cookie Banner"
          }
        ]
      }
    },
    {
      "title": "Performance and analytics cookies",
      "description": "We use Performance and Analytics cookies to collect information about how visitors interact with our website. These cookies help us to understand visitor behavior, such as which pages are the most popular and how users navigate through our site.",
      "linkedCategory": "analytics",

      "cookieTable": {
        "headers": {
          "name": "Name",
          "title": "Service",
          "description": "Description"
        },
        "body": [
          {
            "name": "_ga",
            "title": "Google Analytics",
            "description": "Cookie set by Google Analytics"
          },
          {
            "name": "_gid",
            "title": "Google Analytics",
            "description": "Cookie set by Google Analytics"
          }
        ]
      }
    }
  ]
}`;
