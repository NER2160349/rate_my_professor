import requests
from bs4 import BeautifulSoup
import json
import sys
import os
from dotenv import load_dotenv
from pinecone import Pinecone
from openai import OpenAI

def scrape_school_data(school_url):
    # Send a GET request to the school's page
    response = requests.get(school_url)
    response.raise_for_status()  # Check for request errors

    # Parse the HTML content
    soup = BeautifulSoup(response.text, 'html.parser')

    # Extract school name
    school_name_tag = soup.find('div', class_='HeaderDescription__StyledTitleName-sc-1lt205f-1 eNxccF')
    school_name = school_name_tag.text.strip() if school_name_tag else 'N/A'

    # Extract institute location
    institute_location_tag = soup.find('span', class_='HeaderDescription__StyledCityState-sc-1lt205f-2 cyDJfW')
    institute_location = institute_location_tag.text.strip() if institute_location_tag else 'N/A'

    # Extract overall quality
    overall_quality_tag = soup.find('div', class_='OverallRating__Number-y66epv-3 dXoyqn')
    overall_quality = overall_quality_tag.text.strip() if overall_quality_tag else 'N/A'

    # Find all div elements with the specified class
    ratings_tag = soup.find('div', class_="SchoolSummary__SchoolSummaryContainer-pz83zp-1 kYvWmU")

    # Initialize a dictionary to store the ratings
    ratings_dict = {}

    # Find all category containers
    categories = ratings_tag.find_all('div', class_="CategoryGrade__CategoryGradeContainer-sc-17vzv7e-0")

    # Iterate through each category and extract the title and corresponding rating
    for category in categories:
        title = category.find('div', class_="CategoryGrade__CategoryTitle-sc-17vzv7e-1").text.strip()
        rating = category.find('div', class_=lambda x: x and x.startswith("GradeSquare__ColoredSquare-sc-6d97x2-0")).text.strip()
        ratings_dict[title.lower()] = rating

    # Extract ratings for each category, defaulting to 'N/A' if not found
    reputation = ratings_dict.get('reputation', 'N/A')
    happiness = ratings_dict.get('happiness', 'N/A')
    facilities = ratings_dict.get('facilities', 'N/A')
    safety = ratings_dict.get('safety', 'N/A')
    opportunities = ratings_dict.get('opportunities', 'N/A')
    clubs = ratings_dict.get('clubs', 'N/A')
    social = ratings_dict.get('social', 'N/A')
    internet = ratings_dict.get('internet', 'N/A')
    location = ratings_dict.get('location', 'N/A')
    food = ratings_dict.get('food', 'N/A')

    # Initialize the reviews list
    reviews = []

    # Find all 'ul' elements with the specific class
    review_lists = soup.find_all('ul', class_="SchoolRatingsList__ListContainer-sc-1tg2phb-0 jSdWoM")

    # Iterate over each 'ul' element
    for review_list in review_lists:
        # Find all 'li' elements within this 'ul'
        list_items = review_list.find_all('li')

        # Iterate over each 'li' element
        for item in list_items:
            # Navigate to the nested div
            target_div = item.find('div', class_="SchoolRating__RatingComment-sb9dsm-6 eNyCKI")

            # If the target div exists, extract and clean the review text
            if target_div:
                review = target_div.text.strip()
                reviews.append(review)

    # Save to JSON
    with open('reviews.json', 'w') as f:
        json.dump({
            "school": school_name,
            "location": institute_location,
            "overall_quality": overall_quality,
            "reputation": reputation,
            "happiness": happiness,
            "facilities": facilities,
            "safety": safety,
            "opportunities": opportunities,
            "clubs": clubs,
            "social": social,
            "internet": internet,
            "location_rating": location,
            "food": food,
            "reviews": reviews,
        }, f, indent=4)

def process_and_add_embeddings():
    # Load environment variables
    load_dotenv()

    # Initialize Pinecone
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

    # Define the index name
    index_name = "schoolidx"

    # Load the review data
    with open("reviews.json") as f:
        data = json.load(f)

    processed_data = []
    client = OpenAI()

    # Create embeddings for each review
    for review in data["reviews"]:
        response = client.embeddings.create(
            input=review, model="text-embedding-3-small"
        )
        embedding = response.data[0].embedding
        processed_data.append(
            {
                "values": embedding,
                "id": f"{data['school']}",  # Unique ID based on school and first part of review
                "metadata": {
                    "review": data["reviews"],
                    "location": data["location"],
                    "overall_quality": data["overall_quality"],
                    "reputation": data["reputation"],
                    "happiness": data["happiness"],
                    "facilities": data["facilities"],
                    "safety": data["safety"],
                    "opportunities": data["opportunities"],
                    "clubs": data["clubs"],
                    "social": data["social"],
                    "internet": data["internet"],
                    "location_rating": data["location_rating"],
                    "food": data["food"],
                }
            }
        )

    # Insert the embeddings into the Pinecone index
    index = pc.Index(index_name)
    upsert_response = index.upsert(
        vectors=processed_data,
        namespace="ns1",
    )
    print(f"Upserted count: {upsert_response['upserted_count']}")

    # Print index statistics
    print(index.describe_index_stats())


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 scrape_school_data.py <school_url>")
        sys.exit(1)
    
    school_url = sys.argv[1]
    
    # Scrape the school data
    scrape_school_data(school_url)
    
    # Process and add embeddings
    process_and_add_embeddings()
