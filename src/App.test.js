import React from 'react';
import ReactDOM from 'react-dom';

import { ApolloProvider } from 'react-apollo';
import { mount } from 'enzyme';

import './test/setup';
import { createApolloClient, stubQueryWith } from './test/lib';

import App, { GET_REPOSITORIES_OF_VIEWER } from './App';

let client;
let promise;

const viewerWithRepositories = {
  viewer: {
    name: 'Robin Wieruch',
    repositories: {
      edges: [
        {
          node: {
            id: '1',
            name: 'bar',
            url: 'https://bar.com',
            viewerSubscription: 'UNSUBSCRIBED',
          },
        },
        {
          node: {
            id: '2',
            name: 'qwe',
            url: 'https://qwe.com',
            viewerSubscription: 'UNSUBSCRIBED',
          },
        },
      ],
    },
  },
};

beforeAll(() => {
  promise = stubQueryWith(
    'https://api.github.com/graphql',
    {
      query: GET_REPOSITORIES_OF_VIEWER,
    },
    viewerWithRepositories,
  );

  client = createApolloClient('https://api.github.com/graphql');
});

afterAll(() => {
  fetch.restore();
});

test('it makes use of the Query render prop', done => {
  const wrapper = mount(
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>,
  );

  expect(wrapper.find('[data-test-id="loading"]')).toHaveLength(1);

  promise.then().then(() => {
    // Without setImmediate it still shows the
    // loading indicator [data-test-id="loading"]
    // even though the query result's data comes in
    // the render props function. Dealing with these race conditions
    // feels kinda hacky.
    setImmediate(() => {
      wrapper.update();

      expect(wrapper.find('[data-test-id="profile"]')).toHaveLength(
        1,
      );
      expect(wrapper.find('[data-test-id="profile"]').text()).toEqual(
        viewerWithRepositories.viewer.name,
      );

      done();
    });
  });
});
