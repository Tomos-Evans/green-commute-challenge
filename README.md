# Green Commute Challenge

test

This will be a proof of concept build of a green commute tracking website for use at my work. Its goal is to encourage eco friendly choices for transport. 

The frontend is a react SPA that will be hosted on github pages, and the Auth/Database is provided by supabase. I would like the project to use tailwind. 


The app should prompt users to log in with supabase (curently email/password, but I would like to add Google/Apple login in the future).
The user should be able to choose a display name (I do not want to force them to show their real name). They should also select how they normally commute to work from a dropdown. 
Use display names like discord, so there could be multiple people called `tom`, so make it `tom#23`, `tom#24` etc. 


Once logged in there are multiple pages:
1. Profile page - user can see their history, etc. 
2. Leaderboard - Shows the top 10 users for the all time points. If the logged in user is not in the top 10 then display a ... and their leaderboard ranking. 
3. Add commute page 
   1. Allows users to record their daily commute, to include
   2. mode of transport from a pannel of buttons (more on modes of transport later)
   3. Distance travelled in miles
   4. A toggle for `weather warrior` to indicate if this commute was in bad weather for extra points. 


The app will work on an honour system, there is no proof of distance/transport required. A user can say how many miles they traveled and in which mode of transport and we believe them. 



## Modes of transport

Each mode of transport has an associated points-per-mile.
The incuded modes should come from a database table which will include name, and points per mile. 


## Commute

A commute has a user ID, a mode of transport ID, a distance in miles (float), created at, weather warrior (boolean), 


## Users

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | References `auth.users(id)`, cascades on delete |
| `display_name` | `text` NOT NULL | Base name chosen by the user (e.g. `tom`) |
| `discriminator` | `integer` NOT NULL | Auto-assigned number (e.g. `3` → `tom#3`) |
| `created_at` | `timestamptz` | Defaults to `now()` |




# Other things

I want to use row level security so users can only create commutes for themselves/see detail of their commute. 
The only thing visible to all logged in users is the agreggated leaderboard showing display names and points. 


# Reference Images
Reference images for the various pages are in the `reference_images` directory. Review them for info. 
I would like the style/theme of the site to match these reference images. 

