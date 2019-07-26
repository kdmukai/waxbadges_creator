![waxbadges](src/static/img/waxbadges_logo_350x72.png)

# WAXBadges Achievements CREATOR
_A tool for game studios (and anyone else) to create their own WAXBadges achievement ecosystem_

twitter: [@WAXBadges](https://twitter.com/WAXBadges)


This creator is meant to run locally to create and manage your WAXBadges achievements. By running locally we can make some safe-ish security compromises that greatly enhance your workflow speed (i.e. hard-coding your private key for instant transaction signing; normally a MEGA no-no!!).


### What is WAXBadges?
see the main repo: [https://github.com/kdmukai/waxbadges](https://github.com/kdmukai/waxbadges)


### Getting started:
* Set up your WAX blockchain account
    * Create a free WAX All Access account ([account.wax.io](https://account.wax.io))
    * On the Scatter step, opt to generate new keys that are stored in Scatter. We'll need direct access to your private key later.
* Fund it with some WAX tokens
    * Buy from an exchange and transfer to your WAX account (details are beyond the scope of this doc)
* Buy RAM in Scatter
    * You have to spend WAX to buy blockchain storage space
    * _(how much? A couple hundred kB is fine for starters)_
    * _(you can also sell unused RAM back if you change your mind later)_
* Clone this repo to your local machine
    * git clone https://github.com/kdmukai/waxbadges_creator.git .
* Follow the "Running on your local machine" steps below


### How do I confirm that it worked?
Transactions through the CREATOR tool should be quite fast. You can view your stored data on the WAX blockchain via the official [WAXBadges Achievements Explorer](https://explorer.waxbadges.com).


### Wait, isn't this private key stuff risky?
I mean, kinda. We're greatly reducing risk by only running this customized javascript on your local computer. But anytime you're directly handling a private key you are absolutely in a danger zone.

You must keep these files secure on your local machine. Never upload or host these files on the web! The CREATOR tool looks and acts like a normal website, but treat it as if it were an app that is installed on your local machine. If anyone else on your team needs access, they'll have to download and customize their own copy.

A future enhancement will enable an _authorize-in-Scatter_ option. This will keep your private key in Scatter (or, even better, in a hardware wallet that's connected to Scatter). But as a trade-off you'll have to manually approve every transaction. If you're adding 30 achievements to your new ecosystem it's going to be a pain, though hopefully we'll be able to batch transactions to reduce the number of approvals.


### Bonus security
Add a hardware wallet like a Ledger to Scatter and change your WAX account's "owner" key to the hardware wallet key. The steps above risk compromising your WAX account's "active" key but if you retain tight control of the "owner" key, you can always generate a new "active" key for your account.



## Running on your local machine
Grab the `npm` modules:
```
npm install
```

Customize the `src/local_settings--example.js` file:
```
/**
    Enter your WAX blockchain private key and associated account id. Save this
    file as local_settings.js
**/
var PRIVATE_KEY = '';
var ACCOUNT = '';   // e.g. WAX All Access account like 'abc12.waa' or 12-char WAX blockchain account
```

Run locally with Hot Module Replacement:
```
webpack-dev-server --hot --host 0.0.0.0
```

Point your web browser at:
```
http://127.0.0.1:8080
```
