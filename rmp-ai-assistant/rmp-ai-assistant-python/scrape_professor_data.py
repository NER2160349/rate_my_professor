import requests
from bs4 import BeautifulSoup
import json
import sys
import os
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
from openai import OpenAI

def scrape_professor_data(professor_url):
    response = requests.get(professor_url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')

    name_div = soup.find('div', class_='NameTitle__Name-dowf0z-0')
    if name_div:
        first_name = name_div.find('span').text.strip()
        last_name_span = name_div.find('span', class_='NameTitle__LastNameWrapper-dowf0z-2')
        last_name = last_name_span.text.strip() if last_name_span else ''
        professor_name = f"{first_name} {last_name}"
    else:
        professor_name = 'N/A'

    subject_tag = soup.find('a', class_='TeacherDepartment__StyledDepartmentLink-fl79e8-0 iMmVHb')
    subject = subject_tag.text.strip('department').strip() if subject_tag else 'N/A'

    stars_tag = soup.find('div', class_='RatingValue__Numerator-qw8sqy-2 liyUjw')
    stars = stars_tag.text.strip() if stars_tag else 'N/A'

    review_tag = soup.find('div', class_="Comments__StyledComments-dzzyvm-0 gRjWel")
    review = review_tag.text.strip() if review_tag else 'N/A'

    divs = soup.find_all('div', class_="FeedbackItem__StyledFeedbackItem-uof32n-0 dTFbKx")

    if len(divs) > 1:
        second_div = divs[1]
        difficulty_tag = second_div.find('div', class_="FeedbackItem__FeedbackNumber-uof32n-1 kkESWs")
        difficulty = difficulty_tag.text.strip() if difficulty_tag else 'N/A'
    else:
        difficulty = 'N/A'

    first_div = divs[0]
    rate_tag = first_div.find('div', class_="FeedbackItem__FeedbackNumber-uof32n-1 kkESWs")
    rate = rate_tag.text.strip() if rate_tag else 'N/A'

    tags = []
    tag_container_div = soup.find('div', class_='TeacherTags__TagsContainer-sc-16vmh1y-0 dbxJaW')
    if tag_container_div:
        individual_tags = tag_container_div.find_all('span')
        for tag in individual_tags:
            tag_text = tag.text.strip()
            tags.append(tag_text)

    reviews = []
    review_lists = soup.find_all('ul', class_="RatingsList__RatingsUL-hn9one-0 cbdtns")
    for review_list in review_lists:
        list_items = review_list.find_all('li')
        for item in list_items:
            target_div = item.find('div', class_="Comments__StyledComments-dzzyvm-0 gRjWel")
            if target_div:
                review = target_div.text.strip()
                reviews.append(review)

    # Save to JSON
    with open('reviews.json', 'w') as f:
        json.dump({
            "professor": professor_name,
            "subject": subject,
            "stars": stars,
            "level of difficulty": difficulty,
            "take again": rate,
            "tags": tags,
            "reviews": reviews,  # Ensure the key matches in process_and_add_embeddings
        }, f, indent=4)

def process_and_add_embeddings():
    # Load environment variables
    load_dotenv()

    # Initialize Pinecone
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

    # Define the index name
    index_name = "rag"

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
                "id": f"{data['professor']}",  # Unique ID based on professor and first part of review
                "metadata": {
                    "review": data["reviews"],
                    "subject": data["subject"],
                    "stars": data["stars"],
                    "level of difficulty": data["level of difficulty"],
                    "take again": data["take again"],
                    "tags": data["tags"],
                    
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
        print("Usage: python3 scrape_professor_data.py <professor_url>")
        sys.exit(1)
    
    professor_url = sys.argv[1]
    
    # Scrape the professor data
    scrape_professor_data(professor_url)
    
    # Process and add embeddings
    process_and_add_embeddings()
