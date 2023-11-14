# wc-hash-router

wc-hash-router is a lightweight and versatile JavaScript library for implementing hash-based routing in web applications. This library is specifically designed for use with web components, providing a seamless and efficient way to handle client-side navigation.

## Features

- **Hash-Based Routing**: Utilize the URL hash fragment to manage client-side navigation, enabling a smoother user experience without full page reloads.

- **Web Component Integration**: Seamlessly integrate the library with your web components, allowing for modular and reusable routing solutions within your application.

- **Simple Configuration**: Configure routes easily with a straightforward API, making it quick to set up and adapt to your application's specific needs.

- **Event Handling**: Take advantage of event handling mechanisms to respond to route changes, allowing you to update your application's state and UI accordingly.

- **History Management**: Manage browser history gracefully, providing users with the expected back and forward navigation experience.

## Getting Started

To get started with wc-hash-router, follow these steps:

1. Install wc-hash-router via npm:

```bash
npm install @gen2tech/wc-hash-router
```

OR

```bash
yarn add @gen2tech/wc-hash-router
```

2. Import the library into your project:
  
```javascript
import CreateWCRouter, { type RouteConfig } from '@gen2tech/wc-hash-router';
```

3. Initialize wc-hash-router

- There are two ways to initialize wc-hash-router
  
```javascript
const router = CreateWCRouter('shr-wc-base','runTime') // Manipulate DOM while routing
```
OR  

```javascript
const router = CreateWCRouter('shr-wc-base','buildTime') // Default more on this
```

4. Create routes
```javascript
const routes: RouteConfig[] = [
    {
        path: '/',
        name: 'Home',
        element: `sample-two`, // Only Needed if on runTime
        render: () => <sample-one /> // Only Needed if on buildTime
    },
    {
        path: '/sample-one/:first/:middle?/:last?',
        name: 'SampleOne',
        element: `sample-one`,
        render: ({ first, middle, last }) => <sample-one first={first} middle={middle} last={last} />
    },
    {
        path: '/with-children',
        name: 'ChildrenRoutes',
        element: `with-children`,
        render: ({prop}) => <with-children prop={prop}/>,
        children: [
            {
                path: 'child-one/:prop1?',
                name: 'ChildrenRoute.One',
                element: `child-one`,
                render: ({prop1}) => <child-one prop-1={prop1} />,
            },
            {
                path: 'child-two/:prop2',
                name: 'ChildrenRoute.Two',
                element: `child-two`,
                render: ({prop2}) => <child-two prop-2={prop2} />,
            },
        ]
    }
]
```

5. Add routes to the router
```javascript
    // Add routes to the router
router.addRoutes(routes)
```

6. Set middleware for before and after each route
```javascript
router.beforeEachResolve((router, to, from) => {
    console.log(router, to, from)
    return true
}).afterEachResolve((router, to) => {
    console.log(router, to)
})
```

For more detailed information and examples, check out the documentation and example folder in this repository.

Contributing
We welcome contributions! If you have ideas for improvements, new features, or bug fixes, feel free to open an issue or submit a pull request.

License
This project is licensed under the MIT License.
