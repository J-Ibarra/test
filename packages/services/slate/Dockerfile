
RUN node mergeSwagger.js
RUN widdershins --search false --language_tabs 'python:Python' 'javascript:Javascript' --summary output.json -o index.html.md -v


FROM ruby:2.6.5

RUN apt-get update && apt-get install -y nodejs && apt-get install npm \
&& apt-get clean && rm -rf /var/lib/apt/lists/*

RUN npm install -g widdershins

COPY ./Gemfile /usr/src/app/
COPY ./Gemfile.lock /usr/src/app/
WORKDIR /usr/src/app

RUN gem install bundler --version '2.0.2'
RUN bundle install

COPY . /usr/src/app
VOLUME /usr/src/app/source

EXPOSE 4567

CMD ["bundle", "exec", "middleman", "server", "--watcher-force-polling"]
